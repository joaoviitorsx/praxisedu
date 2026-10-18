import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip, EmptyState, Icon } from '../../components';
import { filterClassMembers } from '../../features/teacher/classMembersModel';
import { initials } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

const AVATAR_COLORS = [colors.blue, colors.purple, colors.green, colors.orangeText];

export default function ClassStudentsTab({ members, code }) {
  const [search, setSearch] = useState('');
  const visibleMembers = useMemo(() => filterClassMembers(members, search), [members, search]);
  const isFiltering = members.length > 0 && search.trim().length > 0;
  const renderMember = useCallback(({ item, index }) => <StudentRow member={item} index={index} last={index === visibleMembers.length - 1} />, [visibleMembers.length]);

  return <FlatList
    data={visibleMembers}
    renderItem={renderMember}
    keyExtractor={(member) => member.id}
    style={styles.root}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={styles.listHeader}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}><Text style={text.h2}>Alunos da turma</Text><Text style={text.caption}>Acompanhe a participação e quem precisa de apoio.</Text></View>
        <View style={styles.countBadge} accessible accessibilityLabel={isFiltering ? `${visibleMembers.length} de ${members.length} alunos encontrados` : `${members.length} ${members.length === 1 ? 'aluno' : 'alunos'} na turma`}>
          <Text style={styles.countNumber}>{isFiltering ? visibleMembers.length : members.length}</Text>
          <Text style={styles.countLabel}>{isFiltering ? `DE ${members.length}` : members.length === 1 ? 'ALUNO' : 'ALUNOS'}</Text>
        </View>
      </View>
      {members.length > 0 ? <View style={styles.searchBox}>
        <Icon name="search" size={20} color={colors.gray} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Buscar aluno pelo nome" placeholderTextColor={colors.gray} accessibilityLabel="Buscar aluno pelo nome" autoCorrect={false} returnKeyType="search" style={styles.searchInput} />
        {search ? <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Limpar busca" style={styles.clearSearch}><Icon name="x" size={18} color={colors.gray} /></Pressable> : null}
      </View> : null}
    </View>}
    ListEmptyComponent={members.length ? <EmptyState title="Nenhum aluno encontrado" message="Tente outro nome ou limpe a busca." actionLabel="Limpar busca" onAction={() => setSearch('')} /> : <EmptyState image={require('../../../assets/mascotes/sapo.png')} title="Nenhum aluno ainda" message={`Compartilhe o código ${code} para os estudantes entrarem na turma.`} />}
  />;
}

const StudentRow = memo(function StudentRow({ member: m, index, last }) {
  return <View style={[styles.row, m.needsSupport && styles.supportRow, index === 0 && styles.firstRow, last && styles.lastRow]}>
    <View style={[styles.avatar, { backgroundColor: m.needsSupport ? colors.red : AVATAR_COLORS[index % AVATAR_COLORS.length] }]}><Text style={styles.avatarText}>{initials(m.name)}</Text></View>
    <View style={{ flex: 1 }}>
      <View style={styles.nameRow}>
        <Text style={[styles.name, m.needsSupport && styles.supportName]} numberOfLines={1}>{m.name}</Text>
        {m.needsSupport && <Chip label="Apoio" color={colors.redText} background={colors.redSoft} borderColor="#F5B5B5" />}
      </View>
      <Text style={text.caption}>{m.lessonsCompleted ?? 0} lições ·{' '}<Text style={{ fontFamily: fonts.extrabold, color: m.answersTotal && m.accuracy < 60 ? colors.redText : colors.greenDark }}>{m.accuracy}% acerto</Text></Text>
    </View>
    <View style={styles.xp}><Icon name="zap" size={18} color={colors.orange} fill={colors.orange} /><Text style={styles.xpText}>{m.xp ?? 0}</Text></View>
  </View>;
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  listHeader: { gap: 14 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headingCopy: { flex: 1, gap: 4 },
  countBadge: { minWidth: 72, minHeight: 62, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.blueSoft },
  countNumber: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 26, color: colors.blueDark },
  countLabel: { fontFamily: fonts.extrabold, fontSize: 10, lineHeight: 14, letterSpacing: 0.6, color: colors.blue },
  searchBox: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 14, paddingRight: 4, borderRadius: 15, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
  searchInput: { flex: 1, minHeight: 48, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  clearSearch: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderBottomWidth: 0 },
  firstRow: { marginTop: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  lastRow: { borderBottomWidth: 2, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  supportRow: { backgroundColor: '#FFF7F7' },
  supportName: { color: colors.redText },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink, flexShrink: 1 },
  xp: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.orangeText },
});
