import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, ConfirmModal, EmptyState, Icon, LoadingView, Mascot, Toast } from '../../components';
import { deleteTrailUnit, listenClassTrail, listenTrailDrafts } from '../../services/classTrailService';
import { topicLabel } from '../../constants/topics';
import { friendlyError } from '../../utils/errors';
import { colors, fonts, text } from '../../theme';

export default function ClassTrailsTab({ classId, grade }) {
  const [trail, setTrail] = useState(null);
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setTrail(null); setDrafts(null); setError(''); setToDelete(null); setDeleteError(''); setNotice('');
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
  const renderItem = useCallback(({ item, index }) => <TrailCard unit={item} index={index} onEdit={() => open(item.id)} onDelete={() => { setDeleteError(''); setToDelete(item); }} />, [open]);

  async function confirmDelete() {
    if (!toDelete || deleting) return;
    setDeleting(true); setDeleteError('');
    try {
      const result = await deleteTrailUnit(classId, toDelete.id);
      setToDelete(null);
      setNotice(result.filesPendingCleanup ? 'Tópico excluído; confira os arquivos no Storage.' : 'Tópico excluído da turma.');
    } catch (cause) {
      setDeleteError(friendlyError(cause));
    } finally { setDeleting(false); }
  }

  if (error && (!trail || !drafts)) return <EmptyState isError title="Não foi possível carregar as trilhas" message={error} actionLabel="Tentar novamente" onAction={() => setRetry((value) => value + 1)} />;
  if (!trail || !drafts) return <LoadingView message="Carregando trilhas da turma..." />;

  return <View style={styles.root}><FlatList data={items} keyExtractor={(unit) => unit.id} renderItem={renderItem} style={styles.list} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
    ListHeaderComponent={<View style={styles.header}>
      <View style={styles.intro}><View style={styles.introIcon}><Icon name="book-open" size={25} color={colors.white} /></View><Text style={styles.introEyebrow}>TRILHAS DO {grade}º ANO</Text><Text style={styles.introTitle}>Crie caminhos para aprender.</Text><Text style={styles.introDescription}>Defina o tópico, adicione etapas no mapa e prepare materiais e questões quando quiser.</Text></View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Criar trilha" icon="plus" variant="teacher" onPress={() => open('new')} />
      <View style={styles.listHeading}><Text style={styles.title}>Trilhas da turma</Text><Text style={styles.count}>{items.length}</Text></View>
      <Text style={styles.subtitle}>Edite um tópico para atualizar etapas e materiais. Rascunhos ficam só com você até a publicação.</Text>
    </View>}
    ListEmptyComponent={<EmptyState title="Sua primeira trilha começa aqui" message="Crie um tópico, adicione etapas e escolha entre textos, vídeos, arquivos e questões." actionLabel="Criar trilha" onAction={() => open('new')} />}
  />
    <Toast message={notice} onHide={() => setNotice('')} />
    <ConfirmModal visible={!!toDelete} title={`Excluir “${toDelete?.title || 'tópico sem título'}”?`}
      message={`${toDelete?.unpublished
        ? 'Este rascunho será removido. Os alunos ainda não o veem. Essa ação não pode ser desfeita.'
        : 'O tópico e suas etapas deixarão de aparecer para esta turma. O progresso já registrado dos alunos será mantido. Essa ação não pode ser desfeita.'}${deleteError ? `\n\n${deleteError}` : ''}`}
      confirmLabel="Excluir tópico" loading={deleting} onCancel={() => { if (!deleting) setToDelete(null); }} onConfirm={confirmDelete} />
  </View>;
}

const TrailCard = memo(function TrailCard({ unit, index, onEdit, onDelete }) {
  const steps = Array.isArray(unit.lessons) ? unit.lessons.length : Object.keys(unit.lessons ?? {}).length;
  return <View style={styles.card}>
    <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`Abrir ${unit.title || 'tópico sem título'} para editar`} style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}>
      <View style={styles.mascot}><Mascot name={unit.mascot || 'sapo'} size={48} /></View>
      <View style={styles.cardCopy}>
        <Text style={styles.eyebrow}>TÓPICO {index + 1} · {topicLabel(unit.topic) || 'Sem tema'}</Text>
        <Text style={styles.cardTitle}>{unit.title || 'Tópico sem título'}</Text>
        <View style={styles.cardBottom}><Text style={styles.meta}>{steps} {steps === 1 ? 'etapa' : 'etapas'}</Text><Text style={[styles.status, unit.unpublished || unit.draft ? styles.statusDraft : styles.statusPublished]}>{unit.unpublished ? 'Rascunho' : unit.draft ? 'Alterações pendentes' : 'Publicado'}</Text></View>
      </View>
      <Icon name="chevron-right" size={21} color={colors.blue} />
    </Pressable>
    <View style={styles.cardActions}>
      <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel={`Editar ${unit.title || 'tópico sem título'}`} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Icon name="pencil" size={16} color={colors.blue} /><Text style={styles.editText}>Editar</Text></Pressable>
      <View style={styles.actionDivider} />
      <Pressable onPress={onDelete} accessibilityRole="button" accessibilityLabel={`Excluir ${unit.title || 'tópico sem título'}`} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Icon name="trash" size={16} color={colors.redText} /><Text style={styles.deleteText}>Excluir</Text></Pressable>
    </View>
  </View>;
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 }, content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 12 },
  header: { gap: 12, marginBottom: 6 }, title: { ...text.h2 }, subtitle: { ...text.caption, lineHeight: 20 },
  intro: { gap: 7, padding: 20, borderRadius: 22, backgroundColor: colors.blueDark },
  introIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' },
  introEyebrow: { fontFamily: fonts.extrabold, fontSize: 11, letterSpacing: 1, color: '#DCE6FF' },
  introTitle: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 29, color: colors.white },
  introDescription: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: '#E8EFFF' },
  listHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  count: { minWidth: 26, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 9, overflow: 'hidden', textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 12, color: colors.blue, backgroundColor: colors.blueSoft },
  error: { ...text.caption, color: colors.redText },
  card: { borderWidth: 2, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface, overflow: 'hidden' },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, minHeight: 106 },
  cardActions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  action: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  actionDivider: { width: 1, height: 22, backgroundColor: colors.border },
  editText: { fontFamily: fonts.bold, fontSize: 13, color: colors.blue },
  deleteText: { fontFamily: fonts.bold, fontSize: 13, color: colors.redText },
  mascot: { width: 66, alignItems: 'center' }, cardCopy: { flex: 1, gap: 6, minWidth: 0 },
  eyebrow: { fontFamily: fonts.extrabold, fontSize: 10, letterSpacing: 0.6, color: colors.blue },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 21, color: colors.ink },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  meta: { ...text.caption, fontSize: 12 }, status: { fontFamily: fonts.bold, fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, overflow: 'hidden' },
  statusDraft: { color: colors.orangeText, backgroundColor: colors.orangeSoft }, statusPublished: { color: colors.greenDark, backgroundColor: colors.greenSoft },
  pressed: { opacity: 0.7 },
});
