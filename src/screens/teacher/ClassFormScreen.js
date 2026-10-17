import { useEffect, useState } from 'react';
import { View, Text, Share, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Screen, Header, Input, OptionPicker, Button, LoadingView, EmptyState, Toast } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { generateClassCode, createClass, getClass, updateClass } from '../../services/classService';
import { GRADES, SHIFTS } from '../../constants/classes';
import { friendlyError } from '../../utils/errors';
import { teacherShortName } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

// Screen 07: create or edit a class. Pass classId in the route params to edit.
export default function ClassFormScreen({ navigation, route }) {
  const classId = route.params?.classId;
  const isEdit = !!classId;
  const { user, profile } = useAuth();

  const [name, setName] = useState('');
  const [grade, setGrade] = useState(1);
  const [shift, setShift] = useState('morning');
  const [code, setCode] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        if (isEdit) {
          const cls = await getClass(classId);
          if (!active) return;
          if (!cls) throw new Error('CLASS_NOT_FOUND');
          setName(cls.name); setGrade(cls.grade); setShift(cls.shift); setCode(cls.code);
        } else {
          const newCode = await generateClassCode();
          if (active) setCode(newCode);
        }
      } catch (e) {
        if (active) setLoadError(friendlyError(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => { active = false; };
  }, [classId]);

  async function copyCode() {
    await Clipboard.setStringAsync(code);
    setToast('Código copiado');
  }

  function shareCode() {
    Share.share({ message: `Entre na minha turma "${name || 'Biologia'}" no Práxis Edu com o código ${code}.` });
  }

  async function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 40) {
      setNameError('Digite o nome da turma (de 2 a 40 letras).');
      return;
    }
    setNameError('');
    setSaveError('');
    setSaving(true);
    try {
      if (isEdit) {
        await updateClass(classId, { name: trimmed, grade, shift });
      } else {
        const teacher = { uid: user.uid, name: teacherShortName(profile.name), school: profile.school };
        await createClass(teacher, { name: trimmed, grade, shift, code });
      }
      navigation.navigate('TeacherTabs', {
        screen: 'Classes',
        params: { toast: isEdit ? 'Turma atualizada' : `Turma ${trimmed} criada` },
      });
    } catch (e) {
      setSaveError(friendlyError(e));
      // code collision: show a new code so the teacher can try again
      if (!isEdit && /CLASS_CODE_UNAVAILABLE/.test(e.message)) generateClassCode().then(setCode).catch(() => {});
      setSaving(false);
    }
  }

  return (
    <Screen padded={false} lightStatusBar>
      <Header
        title={isEdit ? 'Editar Turma' : 'Criar Turma'}
        backLabel="Turmas"
        onBack={() => navigation.goBack()}
      />
      {loading ? (
        <LoadingView />
      ) : loadError ? (
        <EmptyState isError title="Não foi possível carregar" message={loadError} actionLabel="Voltar" onAction={() => navigation.goBack()} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Screen scroll contentStyle={styles.content}>
            <Input
              label="Nome da turma"
              value={name}
              onChangeText={setName}
              placeholder="Ex.: 3º B – Manhã"
              accent={colors.blue}
              error={nameError}
              maxLength={40}
            />
            <OptionPicker label="Série / Ano" options={GRADES} value={grade} onChange={setGrade} />
            <OptionPicker label="Turno" options={SHIFTS} value={shift} onChange={setShift} />

            <View style={{ gap: 8 }}>
              <Text style={text.label}>Código de entrada</Text>
              <View style={styles.codeBox}>
                <Text style={styles.code}>{code}</Text>
                <Text style={text.caption}>{isEdit ? 'O código não pode ser alterado' : 'Gerado automaticamente'}</Text>
                <View style={styles.codeActions}>
                  <Button title="Copiar" icon="copy" variant="outline" size="md" onPress={copyCode} style={{ flex: 1 }} />
                  <Button title="Compartilhar" icon="share" variant="outline" size="md" onPress={shareCode} style={{ flex: 1 }} />
                </View>
              </View>
            </View>

            <View style={{ flex: 1 }} />

            {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
            <View style={{ gap: 8 }}>
              <Button title="Salvar Turma" variant="success" onPress={save} loading={saving} />
              <Button title="Cancelar" variant="ghost" size="md" onPress={() => navigation.goBack()} />
            </View>
          </Screen>
        </KeyboardAvoidingView>
      )}
      <Toast message={toast} onHide={() => setToast('')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 32, gap: 20 },
  codeBox: {
    borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#93AEF0', backgroundColor: colors.blueSoft,
    padding: 20, alignItems: 'center', gap: 6,
  },
  code: { fontFamily: fonts.extrabold, fontSize: 36, letterSpacing: 6, color: colors.blue },
  codeActions: { flexDirection: 'row', gap: 8, marginTop: 10, width: '100%' },
  error: {
    fontFamily: fonts.bold, fontSize: 15, color: colors.redText, backgroundColor: colors.redSoft,
    borderWidth: 2, borderColor: '#F5B5B5', borderRadius: 14, padding: 14,
  },
});
