import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Header, Icon, Button, EmptyState } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import {
  listenUserNotes,
  createNote,
  updateNote,
  deleteNote,
  NOTE_TOPICS,
} from '../../services/notesService';
import { playClickSound, playCorrectSound, playWrongSound } from '../../services/soundService';
import { colors, fonts, radius } from '../../theme';
import { confirmAction, showAlert } from '../../utils/alert';

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} de ${month}, ${hours}:${minutes}`;
}

export default function NotesScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [notes, setNotes] = useState(undefined); // undefined = loading
  const [selectedTopic, setSelectedTopic] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal editor state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null); // null = new note
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTopic, setNoteTopic] = useState('citologia');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setNotes([]);
      return;
    }
    const unsubscribe = listenUserNotes(
      user.uid,
      (data) => setNotes(data),
      () => setNotes([])
    );
    return () => unsubscribe();
  }, [user?.uid]);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    return notes.filter((item) => {
      const matchTopic = selectedTopic === 'todos' || item.topic === selectedTopic;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q));
      return matchTopic && matchQuery;
    });
  }, [notes, selectedTopic, searchQuery]);

  function openNewNoteModal(defaultTopic = null) {
    playClickSound();
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteTopic(defaultTopic && defaultTopic !== 'todos' ? defaultTopic : 'citologia');
    setModalVisible(true);
  }

  function openEditNoteModal(note) {
    playClickSound();
    setEditingNote(note);
    setNoteTitle(note.title || '');
    setNoteContent(note.content || '');
    setNoteTopic(note.topic || 'geral');
    setModalVisible(true);
  }

  async function handleSaveNote() {
    if (!noteTitle.trim() && !noteContent.trim()) {
      showAlert('Anotação vazia', 'Escreva ao menos um título ou conteúdo para salvar.');
      return;
    }

    setSaving(true);
    try {
      const topicObj = NOTE_TOPICS.find((t) => t.id === noteTopic) || NOTE_TOPICS[1];
      if (editingNote) {
        await updateNote(user.uid, editingNote.id, {
          title: noteTitle,
          content: noteContent,
          topic: noteTopic,
          color: topicObj.color,
        });
      } else {
        await createNote(user.uid, {
          title: noteTitle,
          content: noteContent,
          topic: noteTopic,
          color: topicObj.color,
        });
      }
      playCorrectSound();
      setModalVisible(false);
    } catch {
      showAlert('Erro', 'Não foi possível salvar a anotação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteNote(note) {
    playClickSound();
    confirmAction('Excluir anotação', `Tem certeza que deseja apagar “${note.title || 'esta anotação'}”?`, 'Excluir', async () => {
      try {
        await deleteNote(user.uid, note.id);
        playWrongSound();
        setModalVisible(false);
      } catch {
        showAlert('Erro', 'Não foi possível excluir a anotação.');
      }
    });
  }

  const topicColorMap = useMemo(() => {
    const map = {};
    NOTE_TOPICS.forEach((t) => {
      map[t.id] = t.color;
    });
    return map;
  }, []);

  return (
    <Screen padded={false}>
      <Header
        title="Caderno de Anotações"
        backLabel="Perfil"
        onBack={() => navigation.goBack()}
        background={colors.greenDark}
      />

      <View style={styles.topBar}>
        {/* Search input */}
        <View style={styles.searchRow}>
          <Icon name="search" size={18} color={colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar em suas anotações..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <Icon name="x" size={16} color={colors.gray} />
            </Pressable>
          )}
        </View>

        {/* Topic filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicsScroll}
        >
          {NOTE_TOPICS.map((t) => {
            const isSelected = selectedTopic === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  playClickSound();
                  setSelectedTopic(t.id);
                }}
                style={[
                  styles.topicChip,
                  isSelected && {
                    backgroundColor: t.color,
                    borderColor: t.color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.topicChipText,
                    isSelected && { color: colors.white },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content List */}
      {notes === undefined ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.greenDark} />
          <Text style={styles.loadingText}>Carregando seu caderno...</Text>
        </View>
      ) : filteredNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title={
              searchQuery
                ? 'Nenhuma anotação encontrada'
                : selectedTopic !== 'todos'
                ? `Nenhuma nota de ${selectedTopic}`
                : 'Seu caderno está vazio'
            }
            message={
              searchQuery
                ? 'Tente pesquisar por outros termos.'
                : 'Crie resumos, conceitos-chave e macetes de biologia para consultar quando quiser!'
            }
            actionLabel="Criar anotação agora"
            actionVariant="success"
            onAction={() => openNewNoteModal(selectedTopic)}
          />
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const tagColor = topicColorMap[item.topic] || colors.green;
            const topicLabel =
              NOTE_TOPICS.find((t) => t.id === item.topic)?.label || 'Geral';

            return (
              <Pressable
                style={({ pressed }) => [
                  styles.noteCard,
                  { borderLeftColor: tagColor },
                  pressed && styles.cardPressed,
                ]}
                onPress={() => openEditNoteModal(item)}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.tagBadge,
                      { backgroundColor: `${tagColor}22` },
                    ]}
                  >
                    <View
                      style={[styles.tagDot, { backgroundColor: tagColor }]}
                    />
                    <Text style={[styles.tagText, { color: tagColor }]}>
                      {topicLabel}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {formatDate(item.updatedAt || item.createdAt)}
                  </Text>
                </View>

                <Text style={styles.noteTitle} numberOfLines={1}>
                  {item.title || 'Sem título'}
                </Text>

                {!!item.content && (
                  <Text style={styles.notePreview} numberOfLines={3}>
                    {item.content}
                  </Text>
                )}

                <View style={styles.cardFooter}>
                  <Pressable
                    style={styles.cardAction}
                    onPress={() => openEditNoteModal(item)}
                  >
                    <Icon name="edit-2" size={14} color={colors.greenDark} />
                    <Text style={styles.cardActionText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.cardAction}
                    onPress={() => handleDeleteNote(item)}
                  >
                    <Icon name="trash-2" size={14} color={colors.redText} />
                    <Text
                      style={[
                        styles.cardActionText,
                        { color: colors.redText },
                      ]}
                    >
                      Excluir
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Floating Action Button (FAB) for New Note */}
      <View
        style={[
          styles.fabWrapper,
          { bottom: Math.max(insets.bottom, 16) + 16 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => openNewNoteModal(selectedTopic)}
        >
          <Icon name="plus" size={24} color={colors.white} strokeWidth={2.5} />
          <Text style={styles.fabText}>Nova Anotação</Text>
        </Pressable>
      </View>

      {/* Modal Editor / Viewer */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
            >
              <Icon name="x" size={22} color={colors.ink} />
            </Pressable>
            <Text style={styles.modalHeading}>
              {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
            </Text>
            {editingNote ? (
              <Pressable
                onPress={() => handleDeleteNote(editingNote)}
                style={styles.deleteHeaderBtn}
              >
                <Icon name="trash-2" size={20} color={colors.red} />
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Topic Selector */}
            <Text style={styles.fieldLabel}>Tema de Biologia</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topicModalRow}
            >
              {NOTE_TOPICS.filter((t) => t.id !== 'todos').map((t) => {
                const isSelected = noteTopic === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      playClickSound();
                      setNoteTopic(t.id);
                    }}
                    style={[
                      styles.modalTopicChip,
                      isSelected && {
                        backgroundColor: t.color,
                        borderColor: t.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalTopicText,
                        isSelected && { color: colors.white },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Note Title Input */}
            <Text style={styles.fieldLabel}>Título da Anotação</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Ex: Fases da Mitose, Síntese de Proteínas..."
              placeholderTextColor={colors.gray}
              value={noteTitle}
              onChangeText={setNoteTitle}
              maxLength={120}
            />

            {/* Note Content Input */}
            <Text style={styles.fieldLabel}>Suas Anotações e Resumo</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Escreva seus resumos, macetes, observações das aulas ou pontos importantes para fixar..."
              placeholderTextColor={colors.gray}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
              numberOfLines={12}
            />

            {/* Save Button */}
            <View style={styles.modalBtnRow}>
              <Button
                title={saving ? 'Salvando...' : 'Salvar no Caderno'}
                icon="check"
                variant="reward"
                loading={saving}
                onPress={handleSaveNote}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  topicsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  topicChipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.gray,
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 5,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.gray,
  },
  noteTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: colors.ink,
  },
  notePreview: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: '#4B5563',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  cardActionText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.greenDark,
  },
  fabWrapper: {
    position: 'absolute',
    right: 20,
    zIndex: 99,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.greenDark,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    shadowColor: colors.greenDark,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  fabText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.white,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  modalHeading: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: colors.ink,
  },
  deleteHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FDE8E8',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    marginTop: 14,
    marginBottom: 8,
  },
  topicModalRow: {
    gap: 8,
    paddingBottom: 6,
  },
  modalTopicChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTopicText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },
  titleInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: 14,
    height: 46,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  contentInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: 14,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
    minHeight: 180,
  },
  modalBtnRow: {
    marginTop: 24,
  },
});
