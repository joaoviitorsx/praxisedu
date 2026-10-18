import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Animated, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Icon, LoadingView, EmptyState } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import { listenChat, saveChatMessage, consumeAiQuota } from '../../services/chatService';
import { askBioBot } from '../../services/aiService';
import { AI_DAILY_LIMIT } from '../../constants/gamification';
import { friendlyError } from '../../utils/errors';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, text } from '../../theme';

// Screen 15: BioBot chat (Gemini), history saved in botChats/{uid}
export default function BioBotScreen() {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState(null); // null = still loading
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [sendError, setSendError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [pendingQuestion, setPendingQuestion] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setLoadError('');
    return listenChat(user.uid, (data) => { setMessages(data); setLoadError(''); }, (e) => setLoadError(friendlyError(e)));
  }, [user.uid, retryKey]);

  async function send(rawText) {
    const question = rawText.trim();
    if (!question || typing || pendingQuestion) return;
    setDraft('');
    setSendError('');
    setTyping(true);
    let savedQuestion = false;
    try {
      await consumeAiQuota(user.uid, 'chatCount', AI_DAILY_LIMIT.chat);
      await saveChatMessage(user.uid, 'user', question);
      savedQuestion = true;
      const history = [...(messages ?? []), { role: 'user', text: question }];
      const answer = await askBioBot(history);
      await saveChatMessage(user.uid, 'model', answer);
    } catch (e) {
      if (savedQuestion) setPendingQuestion(question);
      else setDraft(question);
      setSendError(friendlyError(e));
    } finally {
      setTyping(false);
    }
  }

  async function retryAnswer() {
    if (!pendingQuestion || typing) return;
    setTyping(true);
    setSendError('');
    try {
      const history = messages ?? [];
      const last = history[history.length - 1];
      const completeHistory = last?.role === 'user' && last.text === pendingQuestion ? history : [...history, { role: 'user', text: pendingQuestion }];
      const answer = await askBioBot(completeHistory);
      await saveChatMessage(user.uid, 'model', answer);
      setPendingQuestion('');
    } catch (e) { setSendError(friendlyError(e)); }
    finally { setTyping(false); }
  }

  const firstName = profile.name.split(' ')[0];
  const greeting = `Olá ${firstName}! O que quer revisar de Biologia hoje?`;

  return (
    <Screen padded={false} lightStatusBar>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.logoBox}>
          <Icon name="leaf" size={28} color={colors.green} fill={colors.green} />
          <View style={styles.sparkle}><Icon name="sparkles" size={12} color={colors.white} strokeWidth={2.6} /></View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>BioBot IA</Text>
            <View style={styles.badge}>
              <Icon name="sparkles" size={14} color={colors.purple} />
              <Text style={styles.badgeText}>Gemini</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Seu tutor de Biologia</Text>
        </View>
      </View>

      {loadError ? (
        <EmptyState isError title="Não foi possível carregar a conversa" message={loadError} actionLabel="Tentar novamente" actionVariant="success" onAction={() => setRetryKey((value) => value + 1)} />
      ) : messages === null ? (
        <LoadingView message="Carregando conversa..." />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chat}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            <Bubble role="model" text={greeting} />
            {messages.map((m) => <Bubble key={m.id} role={m.role} text={m.text} />)}
            {typing && <TypingBubble />}
            {sendError ? <Text style={styles.error}>{sendError}</Text> : null}
            {pendingQuestion ? <Pressable onPress={retryAnswer} disabled={typing} accessibilityRole="button" style={styles.retryReply}><Text style={styles.retryReplyText}>Tentar resposta novamente</Text></Pressable> : null}
          </ScrollView>

          <View style={styles.composer}>
            <View style={styles.inputRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => send(draft)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                accessibilityLabel="Digite sua dúvida"
                placeholder="Digite sua dúvida"
                placeholderTextColor={colors.gray}
                returnKeyType="send"
                maxLength={500}
                style={[styles.input, inputFocused && styles.inputFocused]}
              />
              <Pressable
                onPress={() => send(draft)}
                disabled={typing || !!pendingQuestion || !draft.trim()}
                accessibilityRole="button"
                accessibilityLabel="Enviar dúvida ao BioBot"
                style={({ pressed }) => [
                  styles.sendEdge,
                  (typing || !!pendingQuestion || !draft.trim()) && styles.sendDisabled,
                  pressed && styles.sendPressed,
                ]}
              >
                <Icon name="send" size={22} color={colors.white} />
              </Pressable>
            </View>
            <Text style={styles.disclaimer}>Respostas geradas por IA podem conter erros.</Text>
          </View>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

function BotAvatar() {
  return (
    <View style={styles.botAvatar}>
      <Icon name="leaf" size={18} color={colors.white} fill={colors.white} />
    </View>
  );
}

function Bubble({ role, text: content }) {
  if (role === 'user') {
    return (
      <Reanimated.View entering={FadeInDown.duration(260)} style={styles.mine}>
        <Text style={styles.mineText}>{content}</Text>
      </Reanimated.View>
    );
  }
  return (
    <Reanimated.View entering={FadeInDown.duration(260)} style={styles.botRow}>
      <BotAvatar />
      <View style={styles.bot}>
        <Text style={styles.botText}>{content}</Text>
      </View>
    </Reanimated.View>
  );
}

// Three dots that jump one after the other
function TypingBubble() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = dots.map((dot, i) => Animated.loop(Animated.sequence([
      Animated.delay(i * 150),
      Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(450 - i * 150),
    ])));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);

  return (
    <View style={styles.botRow}>
      <BotAvatar />
      <View style={[styles.bot, styles.typing]}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, {
            opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
          }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.green, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.greenSoft,
  },
  sparkle: {
    position: 'absolute', right: -6, top: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.purple,
    borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.white },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.white, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.purpleDark },
  subtitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
  chat: { padding: 16, paddingBottom: 12, gap: 10 },
  botRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '88%' },
  botAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  bot: {
    flexShrink: 1, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, paddingVertical: 10, paddingHorizontal: 14,
    borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 6,
  },
  botText: { ...text.body, lineHeight: 23 },
  mine: {
    alignSelf: 'flex-end', maxWidth: '80%', backgroundColor: colors.green, paddingVertical: 10, paddingHorizontal: 14,
    borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 6,
  },
  mineText: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 23, color: colors.white },
  typing: { flexDirection: 'row', gap: 5, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray },
  error: {
    fontFamily: fonts.bold, fontSize: 15, color: colors.redText, backgroundColor: colors.redSoft,
    borderWidth: 2, borderColor: '#F5B5B5', borderRadius: 14, padding: 12,
  },
  retryReply: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.greenSoft },
  retryReplyText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.greenDark },
  composer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  input: {
    flex: 1, height: 52, borderRadius: 999, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
    paddingHorizontal: 18, fontFamily: fonts.medium, fontSize: 16, color: colors.ink, textAlignVertical: 'center',
  },
  inputFocused: { borderColor: colors.green },
  sendEdge: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  sendPressed: { transform: [{ scale: 0.96 }] },
  sendDisabled: { opacity: 0.45 },
  disclaimer: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.gray, textAlign: 'center', paddingBottom: 8, paddingHorizontal: 16 },
});
