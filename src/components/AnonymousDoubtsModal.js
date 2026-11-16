import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Button from './Button';
import Icon from './Icon';
import { useAuth } from '../contexts/AuthContext';
import { sendAnonymousDoubt, listenStudentDoubts } from '../services/doubtService';
import { playClickSound, playCorrectSound } from '../services/soundService';
import { colors, fonts, radius } from '../theme';

const TOPICS = [
  { id: 'geral', label: 'Geral' },
  { id: 'citologia', label: 'Citologia' },
  { id: 'genetica', label: 'Genética' },
  { id: 'ecologia', label: 'Ecologia' },
  { id: 'fisiologia', label: 'Fisiologia' },
  { id: 'evolucao', label: 'Evolução' },
];

export default function AnonymousDoubtsModal({ visible, onClose, classId, className }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'list'
  const [topic, setTopic] = useState('geral');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [myDoubts, setMyDoubts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    if (!visible || !classId || !user?.uid) return;
    setLoadingList(true);
    // Listen only to the current student's own doubts (strictly private from other students)
    const unsubscribe = listenStudentDoubts(
      classId,
      user.uid,
      (data) => {
        setMyDoubts(data);
        setLoadingList(false);
      },
      () => setLoadingList(false)
    );
    return () => unsubscribe();
  }, [visible, classId, user?.uid]);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendAnonymousDoubt(classId, {
        text,
        topic,
        studentId: user?.uid,
      });
      playCorrectSound();
      setText('');
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        setActiveTab('list');
      }, 1500);
    } catch {
      // Handle error gracefully
    } finally {
      setSending(false);
    }
  }

  const pendingCount = myDoubts.filter((d) => d.status === 'pending').length;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.iconCircle}>
                <Icon name="help-circle" size={20} color={colors.white} />
              </View>
              <View>
                <Text style={styles.title}>Mural de Dúvidas</Text>
                <Text style={styles.subtitle}>{className || 'Sua Turma'} • Direto com o Professor</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar">
              <Icon name="x" size={20} color={colors.ink} />
            </Pressable>
          </View>

          {/* Privacy Banner */}
          <View style={styles.privacyBanner}>
            <Icon name="lock" size={16} color={colors.greenDark} />
            <Text style={styles.privacyText}>
              Sua dúvida ou recado é enviado diretamente ao professor. Nenhum colega de turma tem acesso às suas mensagens.
            </Text>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => { playClickSound(); setActiveTab('new'); }}
              style={[styles.tab, activeTab === 'new' && styles.tabActive]}
            >
              <Icon name="edit-3" size={16} color={activeTab === 'new' ? colors.greenDark : colors.gray} />
              <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
                Nova Mensagem
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { playClickSound(); setActiveTab('list'); }}
              style={[styles.tab, activeTab === 'list' && styles.tabActive]}
            >
              <Icon name="list" size={16} color={activeTab === 'list' ? colors.greenDark : colors.gray} />
              <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
                Minhas Dúvidas ({myDoubts.length})
              </Text>
              {pendingCount > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{pendingCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Tab Content */}
          {activeTab === 'new' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
              <Text style={styles.sectionLabel}>QUAL É O ASSUNTO DA DÚVIDA?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicsRow}>
                {TOPICS.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => { playClickSound(); setTopic(t.id); }}
                    style={[styles.topicChip, topic === t.id && styles.topicChipSelected]}
                  >
                    <Text style={[styles.topicChipText, topic === t.id && styles.topicChipTextSelected]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.sectionLabel}>ESCREVA SUA DÚVIDA OU RECADO PARA O PROFESSOR</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ex: Professor, ainda não entendi bem a diferença entre mitose e meiose nas células reprodutivas..."
                placeholderTextColor={colors.gray}
                multiline
                numberOfLines={4}
                maxLength={400}
                value={text}
                onChangeText={setText}
                textAlignVertical="top"
              />
              <Text style={styles.counter}>{text.length}/400 caracteres</Text>

              {successMsg ? (
                <View style={styles.successBox}>
                  <Icon name="check-circle" size={20} color={colors.greenDark} />
                  <Text style={styles.successText}>Dúvida enviada com sucesso ao professor!</Text>
                </View>
              ) : (
                <Button
                  title={sending ? 'Enviando ao professor...' : 'Enviar Dúvida ao Professor'}
                  icon="send"
                  variant="success"
                  disabled={!text.trim() || sending}
                  loading={sending}
                  onPress={handleSend}
                />
              )}
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
              {loadingList ? (
                <ActivityIndicator size="small" color={colors.green} style={{ marginTop: 20 }} />
              ) : myDoubts.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Icon name="message-square" size={36} color={colors.gray} />
                  <Text style={styles.emptyTitle}>Nenhuma dúvida enviada ainda</Text>
                  <Text style={styles.emptyDesc}>Suas dúvidas e recados para o professor ficarão salvos aqui de forma privada para você acompanhar.</Text>
                </View>
              ) : (
                myDoubts.map((item) => (
                  <View key={item.id} style={styles.doubtCard}>
                    <View style={styles.doubtHeader}>
                      <View style={styles.topicBadge}>
                        <Text style={styles.topicBadgeText}>{item.topic?.toUpperCase()}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          item.status === 'addressed' ? styles.statusAddressed : styles.statusPending,
                        ]}
                      >
                        <Icon
                          name={item.status === 'addressed' ? 'check' : 'clock'}
                          size={12}
                          color={item.status === 'addressed' ? colors.greenDark : colors.orangeText}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            item.status === 'addressed' ? styles.statusTextAddressed : styles.statusTextPending,
                          ]}
                        >
                          {item.status === 'addressed' ? 'Explicado pelo professor' : 'Aguardando professor'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.doubtText}>{item.text}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.purple || '#7C4DFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.gray,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: radius.md || 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 14,
  },
  privacyText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.greenDark,
    lineHeight: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md || 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.gray,
  },
  tabTextActive: {
    color: colors.greenDark,
  },
  badgeCount: {
    backgroundColor: colors.orangeText,
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeCountText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.white,
  },
  formContainer: {
    gap: 8,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.gray,
    letterSpacing: 0.5,
    marginTop: 6,
  },
  topicsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topicChipSelected: {
    backgroundColor: colors.greenDark,
    borderColor: colors.greenDark,
  },
  topicChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  topicChipTextSelected: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radius.md || 12,
    padding: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.ink,
    minHeight: 110,
  },
  counter: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.gray,
    textAlign: 'right',
    marginBottom: 8,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: radius.md || 12,
  },
  successText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.greenDark,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 24,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  emptyDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.gray,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  doubtCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md || 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  doubtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicBadge: {
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  topicBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#673AB7',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusAddressed: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  statusTextPending: {
    color: colors.orangeText,
  },
  statusTextAddressed: {
    color: colors.greenDark,
  },
  doubtText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
});
