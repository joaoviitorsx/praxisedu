import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, EmptyState, Icon, LoadingView, Screen } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenClassMembers } from '../../services/classService';
import { createDuel, getDuelTopicPools } from '../../services/duelService';
import { duelCandidates } from '../../features/student/duelModel';
import { friendlyError } from '../../utils/errors';
import { initials } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

export default function ChallengeDuelScreen() {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [members, setMembers] = useState(undefined);
  const [topics, setTopics] = useState(undefined);
  const [topicId, setTopicId] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setError('');
    if (!profile.classId) { setMembers([]); setTopics([]); return undefined; }
    let active = true;
    const stop = listenClassMembers(profile.classId, setMembers, (cause) => { if (active) setError(friendlyError(cause)); });
    getDuelTopicPools().then((data) => { if (active) { setTopics(data); setTopicId(data[0]?.id ?? null); } }).catch((cause) => { if (active) setError(friendlyError(cause)); });
    return () => { active = false; stop(); };
  }, [profile.classId, retry]);

  const visibleMembers = useMemo(() => duelCandidates(members, user.uid, search), [members, user.uid, search]);
  const classmateCount = useMemo(() => duelCandidates(members, user.uid).length, [members, user.uid]);
  const opponent = visibleMembers.find((item) => item.id === opponentId) ?? duelCandidates(members, user.uid).find((item) => item.id === opponentId);
  const chosenTopic = topics?.find((item) => item.id === topicId);

  async function submit() {
    if (!chosenTopic || !opponentId || saving) return;
    setSaving(true);
    try {
      const duelId = await createDuel({ classId: profile.classId, uid: user.uid, name: profile.name, opponentId, topic: chosenTopic.id, pool: chosenTopic.questions });
      router.replace({ pathname: '/student/duel/[duelId]', params: { duelId } });
    } catch (cause) { setError(friendlyError(cause)); setSaving(false); }
  }

  const renderMember = useCallback(({ item }) => <Pressable onPress={() => setOpponentId(item.id)} accessibilityRole="radio" accessibilityState={{ selected: item.id === opponentId }} style={({ pressed }) => [styles.member, item.id === opponentId && styles.memberSelected, pressed && styles.pressed]}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View><View style={{ flex: 1 }}><Text style={styles.name} numberOfLines={1}>{item.name}</Text><Text style={text.caption}>{item.xp ?? 0} XP</Text></View><View style={[styles.radio, item.id === opponentId && styles.radioOn]}>{item.id === opponentId && <Icon name="check" size={16} color={colors.white} />}</View></Pressable>, [opponentId]);

  const header = <View style={styles.headerContent}><Text style={styles.kicker}>NOVO DUELO</Text><Text style={styles.heading}>Desafiar colega</Text><Text style={styles.subtitle}>Escolha um tema com questões disponíveis e um colega da turma.</Text><Text style={styles.sectionTitle}>Tema do duelo</Text><View style={styles.topics}>{topics?.map((topic) => <Pressable key={topic.id} onPress={() => setTopicId(topic.id)} accessibilityRole="radio" accessibilityState={{ selected: topic.id === topicId }} style={[styles.topic, topic.id === topicId && styles.topicOn]}><Text style={[styles.topicText, topic.id === topicId && styles.topicTextOn]}>{topic.label} · {topic.questions.length}</Text></Pressable>)}</View>{topics?.length === 0 && <Text style={styles.hint}>Ainda não há temas com cinco questões publicadas.</Text>}<Text style={styles.sectionTitle}>Colegas da turma{classmateCount ? ` · ${classmateCount}` : ''}</Text>{classmateCount > 0 && <View style={styles.search}><Icon name="search" size={18} color={colors.gray} /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar colega pelo nome" placeholderTextColor={colors.gray} style={styles.searchInput} autoCorrect={false} returnKeyType="search" accessibilityLabel="Buscar colega" />{!!search && <Pressable onPress={() => setSearch('')} hitSlop={10} accessibilityLabel="Limpar busca"><Icon name="x" size={18} color={colors.gray} /></Pressable>}</View>}</View>;

  return <Screen padded={false}><View style={[styles.top, { paddingTop: insets.top + 8 }]}><Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.back}><Icon name="chevron-left" size={22} color={colors.ink} /><Text style={styles.backText}>Duelos</Text></Pressable></View>
    {error ? <View style={styles.error}><EmptyState isError title="Não foi possível continuar" message={error} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetry((value) => value + 1)} /></View>
      : members === undefined || topics === undefined ? <LoadingView message="Buscando colegas e temas..." />
      : <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><FlatList data={visibleMembers} keyExtractor={(item) => item.id} renderItem={renderMember} ListHeaderComponent={header} ListEmptyComponent={classmateCount === 0 ? <EmptyState title="Você ainda está sozinho na turma" message={`Peça para seus colegas entrarem com o código da turma (seu professor pode compartilhar). Assim que alguém entrar, aparece aqui.`} /> : <EmptyState title="Nenhum colega com esse nome" message="Confira a grafia ou limpe a busca." actionLabel="Limpar busca" onAction={() => setSearch('')} />} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" /><View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}><Button title={opponent ? `Desafiar ${opponent.name.split(' ')[0]}` : 'Escolha um colega'} icon="swords" onPress={submit} disabled={!opponentId || !chosenTopic} loading={saving} /></View></KeyboardAvoidingView>}
  </Screen>;
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, backgroundColor: colors.surface }, back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }, backText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink }, list: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 }, headerContent: { gap: 10, paddingBottom: 12 }, kicker: { ...text.label, color: colors.purple }, heading: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.ink }, subtitle: { ...text.body, color: colors.gray, lineHeight: 22 }, sectionTitle: { ...text.label, marginTop: 12 }, topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, topic: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, topicOn: { backgroundColor: colors.purpleSoft, borderColor: colors.purple }, topicText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink }, topicTextOn: { color: colors.purpleDark }, hint: { ...text.caption }, search: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 2, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface }, searchInput: { flex: 1, minHeight: 48, fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  member: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 12 }, memberSelected: { borderColor: colors.purple, backgroundColor: colors.purpleSoft }, pressed: { opacity: 0.7 }, avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.purple }, avatarText: { fontFamily: fonts.extrabold, color: colors.white }, name: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink }, radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.gray, alignItems: 'center', justifyContent: 'center' }, radioOn: { backgroundColor: colors.purple, borderColor: colors.purple }, footer: { padding: 12, paddingHorizontal: 20, backgroundColor: colors.surface, borderTopWidth: 2, borderColor: colors.border }, error: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
});
