import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, Icon, LoadingView, Mascot } from '../../components';
import { listenClassTrail, listenTrailDrafts } from '../../services/classTrailService';
import { topicLabel } from '../../constants/topics';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

export default function ClassTrailsTab({ classId, grade }) {
  const [trail, setTrail] = useState(null);
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setTrail(null); setDrafts(null); setError('');
    const fail = (source) => (cause) => {
      const details = `${cause?.code ?? ''} ${cause?.message ?? ''}`;
      if (/PERMISSION_DENIED|permission-denied/i.test(details)) {
        setError(`O Firebase bloqueou a leitura de ${source}. Confira se você está na conta do professor dono da turma e se as regras das trilhas foram publicadas no Firebase.`);
      } else {
        setError(friendlyError(cause));
      }
    };
    const stopTrail = listenClassTrail(classId, grade, setTrail, fail('classTrails ou trails'));
    const stopDrafts = listenTrailDrafts(classId, setDrafts, fail('classTrailDrafts'));
    return () => { stopTrail(); stopDrafts(); };
  }, [classId, grade, retry]);

  const items = useMemo(() => {
    if (!trail || !drafts) return [];
    const published = trail.units.map((unit) => ({ ...unit, draft: drafts[unit.id]?.grade === grade }));
    const publishedIds = new Set(published.map((unit) => unit.id));
    const onlyDrafts = Object.entries(drafts).filter(([id, unit]) => unit.grade === grade && !publishedIds.has(id)).map(([id, unit]) => ({ ...unit, id, draft: true, unpublished: true }));
    return [...published, ...onlyDrafts];
  }, [trail, drafts, grade]);

  const open = useCallback((unitId) => router.push({ pathname: '/teacher/class/[classId]/trail/[unitId]', params: { classId, unitId } }), [classId]);
  const renderItem = useCallback(({ item, index }) => <TrailCard unit={item} index={index} onPress={() => open(item.id)} />, [open]);

  if (error && (!trail || !drafts)) return <EmptyState isError title="Não foi possível carregar as trilhas" message={error} actionLabel="Tentar novamente" onAction={() => setRetry((value) => value + 1)} />;
  if (!trail || !drafts) return <LoadingView message="Carregando trilhas da turma..." />;

  return <FlatList data={items} keyExtractor={(unit) => unit.id} renderItem={renderItem} style={styles.list} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
    ListHeaderComponent={<View style={styles.header}>
      <Text style={styles.title}>Trilhas da turma</Text>
      <Text style={styles.subtitle}>Personalize os tópicos do {grade}º ano. Os alunos só veem o que for publicado.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Criar novo tópico" icon="plus" variant="teacher" onPress={() => open('new')} />
      <Text style={styles.listLabel}>{items.length} {items.length === 1 ? 'TÓPICO' : 'TÓPICOS'}</Text>
    </View>}
    ListEmptyComponent={<EmptyState title="Comece por um tópico" message="Crie uma etapa e suas questões para publicar a primeira trilha da turma." actionLabel="Criar tópico" onAction={() => open('new')} />}
  />;
}

const TrailCard = memo(function TrailCard({ unit, index, onPress }) {
  const steps = Array.isArray(unit.lessons) ? unit.lessons.length : Object.keys(unit.lessons ?? {}).length;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Editar ${unit.title || 'tópico sem título'}`} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.mascot}><Mascot name={unit.mascot || 'sapo'} size={46} /></View>
    <View style={styles.cardCopy}>
      <Text style={styles.eyebrow}>TÓPICO {index + 1} · {topicLabel(unit.topic) || 'Sem tema'}</Text>
      <Text style={styles.cardTitle}>{unit.title || 'Tópico sem título'}</Text>
      <Text style={styles.meta}>{steps} {steps === 1 ? 'etapa' : 'etapas'} · {unit.unpublished ? 'Só rascunho' : unit.draft ? 'Publicado + rascunho' : 'Publicado'}</Text>
    </View>
    <Icon name="chevron-right" size={22} color={colors.blue} />
  </Pressable>;
});

const styles = StyleSheet.create({
  list: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 12 },
  header: { gap: 12, marginBottom: 4 }, title: { ...text.h2 }, subtitle: { ...text.caption, lineHeight: 20 },
  error: { ...text.caption, color: colors.redText }, listLabel: { ...text.label, marginTop: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 100, borderWidth: 2, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface },
  mascot: { width: 76, alignItems: 'center' }, cardCopy: { flex: 1, gap: 3 },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.6, color: colors.blue },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 21, color: colors.ink },
  meta: { ...text.caption, fontSize: 12 }, pressed: { opacity: 0.7 },
});
