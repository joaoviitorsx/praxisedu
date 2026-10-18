import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import useReducedMotion from '../hooks/useReducedMotion';
import { colors, fonts, radius } from '../theme';
import { placeStatPopover } from '../features/student/statPopoverLayout';

const DETAILS = {
  streak: {
    title: 'Sequência', icon: 'flame', color: colors.orangeText, background: colors.orangeSoft,
    explanation: 'Conclua pelo menos uma lição em dias consecutivos. Se ficar um dia sem estudar, a sequência recomeça.',
  },
  xp: {
    title: 'Experiência', icon: 'zap', color: colors.purple, background: colors.purpleSoft,
    explanation: 'Você ganha XP ao acertar questões nas lições e nos duelos. Eles mostram o quanto você já praticou.',
  },
  lives: {
    title: 'Vidas', icon: 'heart', color: colors.red, background: colors.redSoft,
    explanation: 'Um erro em uma lição consome uma vida. Você recupera uma vida a cada 30 minutos, até ter cinco.',
  },
};

export default function StudentStatPopover({ active, viewport, onClose }) {
  const reduceMotion = useReducedMotion();
  const reveal = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  const activeId = active?.id;

  useEffect(() => {
    if (!activeId) return undefined;
    closing.current = false;
    reveal.setValue(reduceMotion ? 1 : 0);
    if (!reduceMotion) {
      Animated.timing(reveal, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
    pulse.setValue(0);
    if (reduceMotion) return undefined;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: activeId === 'xp' ? 320 : 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
      Animated.timing(pulse, { toValue: 0, duration: activeId === 'xp' ? 420 : 620, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
    ]));
    animation.start();
    return () => { animation.stop(); reveal.stopAnimation(); };
  }, [activeId, reduceMotion, reveal, pulse]);

  function close() {
    if (closing.current) return;
    closing.current = true;
    if (reduceMotion) { onClose(); return; }
    Animated.timing(reveal, { toValue: 0, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
      if (finished) onClose();
    });
  }

  const detail = active ? DETAILS[active.id] : null;
  const layout = active ? placeStatPopover(active.anchor, viewport) : null;
  const iconMotion = active?.id === 'streak'
    ? [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] }) }, { rotate: pulse.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '7deg'] }) }]
    : active?.id === 'xp'
      ? [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] }) }, { translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, -3] }) }]
      : [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }];

  return (
    <Modal visible={!!active} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      {active && detail && layout && (
        <View style={styles.layer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="Fechar explicação" />
          <Animated.View
            accessibilityViewIsModal
            style={[styles.card, { top: layout.top, left: layout.left, width: layout.width, maxHeight: viewport.height - 24,
              opacity: reveal,
              transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [layout.above ? 7 : -7, 0] }) }, { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
            }]}
          >
            <View style={[styles.arrow, { left: layout.arrowLeft }, layout.above ? styles.arrowBelow : styles.arrowAbove]} />
            <View style={styles.cardTop}>
              <Animated.View style={[styles.iconCircle, { backgroundColor: detail.background, transform: reduceMotion ? [] : iconMotion }]}>
                <Icon name={detail.icon} size={27} color={detail.color} fill={detail.color} />
              </Animated.View>
              <View style={styles.heading}>
                <Text style={styles.title}>{detail.title}</Text>
                <Text style={[styles.value, { color: detail.color }]}>{active.value}</Text>
              </View>
              <Pressable onPress={close} style={({ pressed }) => [styles.close, pressed && styles.closePressed]} accessibilityRole="button" accessibilityLabel="Fechar explicação">
                <Icon name="x" size={19} color={colors.gray} />
              </Pressable>
            </View>
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.explanation}>{detail.explanation}</Text>
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: { flex: 1, backgroundColor: 'rgba(26,26,46,0.12)' },
  card: { position: 'absolute', borderRadius: 18, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, shadowColor: colors.ink, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 22, elevation: 8 },
  arrow: { position: 'absolute', width: 14, height: 14, backgroundColor: colors.surface, transform: [{ rotate: '45deg' }] },
  arrowAbove: { top: -8, borderTopWidth: 1, borderLeftWidth: 1, borderColor: colors.border },
  arrowBelow: { bottom: -8, borderBottomWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, gap: 1 },
  title: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 21, color: colors.ink },
  value: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18 },
  close: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  closePressed: { backgroundColor: colors.background },
  body: { flexShrink: 1 },
  bodyContent: { paddingTop: 10 },
  explanation: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, color: colors.gray },
});
