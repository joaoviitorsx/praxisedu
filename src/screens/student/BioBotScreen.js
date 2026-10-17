import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, KeyboardAvoidingView, Animated, Platform, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Icon, LoadingView, EmptyState } from '../../components';
import AppTextInput from '../../components/AppTextInput';
import { useAuth } from '../../contexts/AuthContext';
import { listenChat, saveChatMessage, consumeAiQuota } from '../../services/chatService';
import { askBioBot } from '../../services/aiService';
import { AI_DAILY_LIMIT } from '../../constants/gamification';
import { friendlyError } from '../../utils/errors';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { colors, fonts, text } from '../../theme';

const SUGGESTIONS = ['O que é mitose?', 'Explique DNA com analogia', 'Célula animal x vegetal'];

// Screen 15: BioBot chat (Gemini), history saved in botChats/{uid}
export default function BioBotScreen() {
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState(null); // null = still loading
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [sendError, setSendError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    return listenChat(user.uid, setMessages, (e) => setLoadError(friendlyError(e)));
  }, [user.uid]);

  async function send(rawText) {
    const question = rawText.trim();
    if (!question || typing) return;
    setDraft('');
    setSendError('');
    setTyping(true);
    try {
      await consumeAiQuota(user.uid, 'chatCount', AI_DAILY_LIMIT.chat);
      await saveChatMessage(user.uid, 'user', question);
      const history = [...(messages ?? []), { role: 'user', text: question }];
      const answer = await askBioBot(history);
      await saveChatMessage(user.uid, 'model', answer);
    } catch (e) {
      setSendError(friendlyError(e));
    } finally {
      setTyping(false);
    }
  }

  const firstName = profile.name.split(' ')[0];
  const greeting = `Olá ${firstName}! O que quer revisar de Biologia hoje?`;

  return (
    <Screen padded={false} lightStatusBar>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.logoBox}>
          <Icon name="leaf" size={30} color={colors.green} fill={colors.green} />
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
        <EmptyState isError title="Não foi possível carregar a conversa" message={loadError} />
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
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsBar}
            contentContainerStyle={styles.suggestions} keyboardShouldPersistTaps="handled">
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} onPress={() => send(s)} style={styles.suggestion}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.inputRow}>
            <AppTextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => send(draft)}
              placeholder="Digite sua dúvida..."
              placeholderTextColor="#64748B"
              returnKeyType="send"
              maxLength={500}
              style={styles.input}
            />
            <Pressable onPress={() => send(draft)} accessibilityLabel="Enviar" style={styles.sendEdge}>
              {({ pressed }) => (
                <View style={[styles.send, pressed && { transform: [{ translateY: 3 }] }]}>
                  <Icon name="send" size={22} color={colors.white} />
                </View>
              )}
            </Pressable>
          </View>
          <Text style={styles.disclaimer}>Respostas geradas por IA podem conter erros.</Text>
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
  }, []);

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
    borderBottomWidth: 3, borderBottomColor: colors.greenDark,
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
  suggestionsBar: { flexGrow: 0 },
  suggestions: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  suggestion: {
    height: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 2, borderColor: '#A7DFC1',
    backgroundColor: colors.greenSoft, justifyContent: 'center',
  },
  suggestionText: { fontFamily: fonts.bold, fontSize: 15, color: colors.greenDark },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  input: {
    flex: 1, height: 52, borderRadius: 999, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface,
    paddingHorizontal: 18, fontFamily: fonts.medium, fontSize: 16, color: colors.ink,
  },
  sendEdge: { width: 52, height: 55, borderRadius: 26, backgroundColor: colors.greenDark },
  send: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { ...text.caption, textAlign: 'center', paddingBottom: 10, paddingHorizontal: 16 },
});
