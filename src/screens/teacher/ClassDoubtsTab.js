import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { EmptyState, Icon } from '../../components';
import { listenClassDoubts, toggleDoubtStatus, deleteDoubt } from '../../services/doubtService';
import { playClickSound, playCorrectSound } from '../../services/soundService';
import { colors, fonts, radius, text } from '../../theme';

export default function ClassDoubtsTab({ classId }) {
  const [doubts, setDoubts] = useState(undefined);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'addressed' | 'all'
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!classId) {
      setDoubts([]);
      return;
    }
    const unsubscribe = listenClassDoubts(classId, (data) => {
      setDoubts(data);
    }, () => setDoubts([]));
    return () => unsubscribe();
  }, [classId]);

  if (doubts === undefined) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.greenDark} />
        <Text style={styles.loadingText}>Carregando mural de dúvidas...</Text>
      </View>
    );
  }

  const pendingCount = doubts.filter((d) => d.status === 'pending').length;
  const addressedCount = doubts.filter((d) => d.status === 'addressed').length;

  const filteredDoubts = doubts.filter((d) => {
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'addressed') return d.status === 'addressed';
    return true;
  });

  async function handleToggleStatus(item) {
    playClickSound();
    setUpdatingId(item.id);
    try {
      await toggleDoubtStatus(classId, item.id, item.status);
      if (item.status === 'pending') playCorrectSound();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o status da dúvida.');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleDelete(item) {
    Alert.alert(
      'Excluir dúvida?',
      'Esta dúvida será removida permanentemente do mural da turma.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoubt(classId, item.id);
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir.');
            }
          },
        },
      ]
    );
  }

  return (
    <FlatList
      data={filteredDoubts}
      keyExtractor={(item) => item.id}
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headingCopy}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={text.h2}>Mural de Dúvidas</Text>
              <View style={styles.anonShield}>
                <Icon name="shield" size={13} color={colors.greenDark} />
                <Text style={styles.anonShieldText}>Anônimo</Text>
              </View>
            </View>
            <Text style={text.caption}>
              Perguntas enviadas por alunos tímidos através da Caixinha da Timidez.
            </Text>
          </View>

          {/* KPI Counters */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, styles.kpiPending]}>
              <Text style={styles.kpiNumber}>{pendingCount}</Text>
              <Text style={styles.kpiLabel}>Aguardando explicação</Text>
            </View>
            <View style={[styles.kpiCard, styles.kpiAddressed]}>
              <Text style={[styles.kpiNumber, { color: colors.greenDark }]}>{addressedCount}</Text>
              <Text style={styles.kpiLabel}>Explicadas em aula</Text>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filters}>
            <Pressable
              onPress={() => { playClickSound(); setFilter('pending'); }}
              style={[styles.filterChip, filter === 'pending' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
                Pendentes ({pendingCount})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { playClickSound(); setFilter('addressed'); }}
              style={[styles.filterChip, filter === 'addressed' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === 'addressed' && styles.filterTextActive]}>
                Explicadas ({addressedCount})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { playClickSound(); setFilter('all'); }}
              style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                Todas ({doubts.length})
              </Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.card, item.status === 'addressed' && styles.cardAddressed]}>
          <View style={styles.cardTop}>
            <View style={styles.topicBadge}>
              <Text style={styles.topicText}>{item.topic?.toUpperCase()}</Text>
            </View>
            <Pressable
              onPress={() => handleDelete(item)}
              hitSlop={8}
              accessibilityLabel="Excluir dúvida"
            >
              <Icon name="trash-2" size={16} color={colors.gray} />
            </Pressable>
          </View>

          <Text style={styles.questionText}>"{item.text}"</Text>

          <View style={styles.cardFooter}>
            <Pressable
              onPress={() => handleToggleStatus(item)}
              disabled={updatingId === item.id}
              style={[
                styles.actionBtn,
                item.status === 'addressed' ? styles.actionBtnDone : styles.actionBtnPending,
              ]}
              accessibilityRole="button"
            >
              <Icon
                name={item.status === 'addressed' ? 'check-circle' : 'circle'}
                size={16}
                color={item.status === 'addressed' ? colors.greenDark : colors.orangeText}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  item.status === 'addressed' ? styles.actionTextDone : styles.actionTextPending,
                ]}
              >
                {item.status === 'addressed' ? 'Explicada na aula (Tocar para reabrir)' : 'Marcar como Explicada na Aula'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          title={
            filter === 'pending'
              ? 'Nenhuma dúvida pendente!'
              : 'Nenhuma dúvida encontrada'
          }
          message={
            filter === 'pending'
              ? 'Parabéns! Todas as dúvidas enviadas pelos alunos foram explicadas em sala.'
              : 'Os alunos podem enviar dúvidas anônimas pela Caixinha da Timidez no celular deles.'
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.gray,
  },
  header: {
    gap: 14,
    marginBottom: 8,
  },
  headingCopy: {
    gap: 4,
  },
  anonShield: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  anonShieldText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.greenDark,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: radius.md || 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  kpiPending: {
    borderLeftWidth: 4,
    borderLeftColor: colors.orangeText,
  },
  kpiAddressed: {
    borderLeftWidth: 4,
    borderLeftColor: colors.greenDark,
  },
  kpiNumber: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.orangeText,
  },
  kpiLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.gray,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill || 20,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: colors.ink,
  },
  filterText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: '#475569',
  },
  filterTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md || 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardAddressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    opacity: 0.85,
  },
  cardTop: {
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
  topicText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#673AB7',
  },
  questionText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  cardFooter: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionBtnPending: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  actionBtnDone: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  actionTextPending: {
    color: colors.orangeText,
  },
  actionTextDone: {
    color: colors.greenDark,
  },
});
