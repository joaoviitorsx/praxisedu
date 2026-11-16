import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { EmptyState, Icon, Button } from '../../components';
import { listenClassDoubts, toggleDoubtStatus, deleteDoubt, replyDoubt } from '../../services/doubtService';
import { playClickSound, playCorrectSound } from '../../services/soundService';
import { colors, fonts, radius, text } from '../../theme';
import { confirmAction, showAlert } from '../../utils/alert';

export default function ClassDoubtsTab({ classId }) {
  const [doubts, setDoubts] = useState(undefined);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'addressed' | 'all'
  const [updatingId, setUpdatingId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [savingReply, setSavingReply] = useState(false);

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
      showAlert('Erro', 'Não foi possível atualizar o status da dúvida.');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleDelete(item) {
    confirmAction('Excluir dúvida?', 'Esta dúvida será removida permanentemente do mural da turma.', 'Excluir', async () => {
      try {
        await deleteDoubt(classId, item.id);
      } catch {
        showAlert('Erro', 'Não foi possível excluir.');
      }
    });
  }

  function handleOpenReply(item) {
    setReplyTarget(item);
    setReplyInput(item.teacherReply || '');
  }

  async function handleSaveReply() {
    if (!replyTarget || savingReply) return;
    setSavingReply(true);
    try {
      await replyDoubt(classId, replyTarget.id, replyInput);
      playCorrectSound();
      setReplyTarget(null);
      setReplyInput('');
    } catch {
      showAlert('Erro', 'Não foi possível salvar a resposta do professor.');
    } finally {
      setSavingReply(false);
    }
  }

  return (
    <>
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
              Dúvidas enviadas pelos alunos no Mural de Dúvidas. O nome de quem perguntou não aparece.
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

          <Text style={styles.questionText}>“{item.text}”</Text>

          {item.teacherReply ? (
            <View style={styles.replyCard}>
              <View style={styles.replyHeader}>
                <Icon name="message-circle" size={13} color={colors.blueDark} />
                <Text style={styles.replyAuthor}>Sua resposta enviada aos alunos:</Text>
              </View>
              <Text style={styles.replyText}>{item.teacherReply}</Text>
            </View>
          ) : null}

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
                {item.status === 'addressed' ? 'Explicada' : 'Marcar como Explicada'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleOpenReply(item)}
              style={styles.replyBtn}
              accessibilityRole="button"
            >
              <Icon name="edit-3" size={14} color={colors.blueDark} />
              <Text style={styles.replyBtnText}>
                {item.teacherReply ? 'Editar Resposta' : 'Responder'}
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
              : 'Os alunos enviam dúvidas pelo Mural de Dúvidas, na tela Minha Turma do app.'
          }
        />
      }
    />

    {/* Modal para Responder Dúvida */}
    <Modal visible={!!replyTarget} animationType="fade" transparent onRequestClose={() => setReplyTarget(null)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="message-circle" size={18} color={colors.blueDark} />
              <Text style={styles.modalTitle}>Responder Dúvida do Aluno</Text>
            </View>
            <Pressable onPress={() => setReplyTarget(null)} hitSlop={8}>
              <Icon name="x" size={18} color={colors.ink} />
            </Pressable>
          </View>

          {replyTarget ? (
            <View style={styles.modalOriginalDoubt}>
              <Text style={styles.modalOriginalTopic}>Assunto: {replyTarget.topic?.toUpperCase()}</Text>
              <Text style={styles.modalOriginalText}>“{replyTarget.text}”</Text>
            </View>
          ) : null}

          <Text style={styles.modalInputLabel}>Sua resposta pedagógica (visível para o aluno):</Text>
          <TextInput
            style={styles.modalTextInput}
            placeholder="Ex: Excelente dúvida! Na mitocôndria, a respiração celular ocorre nas cristas mitocondriais..."
            placeholderTextColor={colors.gray}
            multiline
            numberOfLines={4}
            maxLength={400}
            value={replyInput}
            onChangeText={setReplyInput}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <Pressable
              onPress={() => setReplyTarget(null)}
              style={styles.modalCancelBtn}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Button
                title={savingReply ? 'Salvando...' : 'Salvar Resposta'}
                onPress={handleSaveReply}
                disabled={!replyInput.trim() || savingReply}
                loading={savingReply}
                variant="primary"
                icon="send"
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </>
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
    borderRadius: 12,
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
    borderRadius: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
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
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  replyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.blueDark,
  },
  replyCard: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: colors.blue,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  replyAuthor: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.blueDark,
    letterSpacing: 0.3,
  },
  replyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.ink,
  },
  modalOriginalDoubt: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOriginalTopic: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.gray,
    letterSpacing: 0.6,
  },
  modalOriginalText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
    fontStyle: 'italic',
  },
  modalInputLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },
  modalTextInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.gray,
  },
});
