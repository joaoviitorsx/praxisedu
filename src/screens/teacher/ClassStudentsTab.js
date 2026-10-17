import { View, Text, StyleSheet } from 'react-native';
import { Chip, Icon, EmptyState, FadeIn } from '../../components';
import { initials } from '../../utils/format';
import { colors, fonts, text } from '../../theme';

const AVATAR_COLORS = [colors.blue, colors.purple, colors.green, colors.orangeText];

// Screen 08: list of class members (already sorted by XP)
export default function ClassStudentsTab({ members, code }) {
  if (members.length === 0) {
    return (
      <EmptyState
        image={require('../../../assets/mascotes/sapo.png')}
        title="Nenhum aluno ainda"
        message={`Compartilhe o código ${code} para os estudantes entrarem na turma.`}
      />
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.listHeader}>
        <Text style={styles.small}>{members.length} {members.length === 1 ? 'ALUNO' : 'ALUNOS'}</Text>
        <Text style={styles.small}>ORDENADO POR XP</Text>
      </View>
      <FadeIn style={styles.list}>
        {members.map((m, i) => (
          <View key={m.id} style={[styles.row, m.needsSupport && { backgroundColor: '#FFF7F7' }, i === members.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={[styles.avatar, { backgroundColor: m.needsSupport ? colors.red : AVATAR_COLORS[i % 4] }]}>
              <Text style={styles.avatarText}>{initials(m.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, m.needsSupport && { color: colors.redText }]} numberOfLines={1}>{m.name}</Text>
                {m.needsSupport && <Chip label="Apoio" color={colors.redText} background={colors.redSoft} borderColor="#F5B5B5" />}
              </View>
              <Text style={text.caption}>
                {m.lessonsCompleted ?? 0} lições ·{' '}
                <Text style={{ fontFamily: fonts.extrabold, color: m.answersTotal && m.accuracy < 60 ? colors.redText : colors.greenDark }}>
                  {m.accuracy}% acerto
                </Text>
              </Text>
            </View>
            <View style={styles.xp}>
              <Icon name="zap" size={18} color={colors.orange} fill={colors.orange} />
              <Text style={styles.xpText}>{m.xp ?? 0}</Text>
            </View>
          </View>
        ))}
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  listHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { fontFamily: fonts.bold, fontSize: 13, color: colors.gray },
  list: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 20, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 2, borderBottomColor: '#F1F5F9',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink, flexShrink: 1 },
  xp: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.orangeText },
});
