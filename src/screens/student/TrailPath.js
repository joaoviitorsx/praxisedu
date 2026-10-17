import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { Icon, Mascot, FadeIn } from '../../components';
import { colors, fonts } from '../../theme';

const ROW = 116; // height of each lesson row
const OFFSETS = [0, 60, -50, 10, 60]; // zigzag of the path (px from the center)

// lesson state: done (in progress/{uid}), current (first not done) or locked
export function lessonStates(lessons, progress) {
  let currentFound = false;
  return lessons.map((lesson, i) => {
    if (progress[lesson.id]) return { lesson, kind: 'done', stars: progress[lesson.id].stars ?? 0 };
    if (!currentFound) { currentFound = true; return { lesson, kind: 'current', stars: 0 }; }
    return { lesson, kind: 'locked', stars: 0, last: i === lessons.length - 1 };
  });
}

// Screen 11: the trail map with lessons zigzagging down the screen
export default function TrailPath({ items, mascot, onPlay }) {
  const { width } = useWindowDimensions();
  const contentWidth = width - 40;
  const center = contentWidth / 2;
  const currentIndex = Math.max(0, items.findIndex((i) => i.kind === 'current'));
  const decoOffset = OFFSETS[currentIndex % OFFSETS.length];

  return (
    <View style={{ paddingTop: 8 }}>
      {items.map((item, i) => {
        const offset = OFFSETS[i % OFFSETS.length];
        const nodeWidth = item.kind === 'current' ? 84 : 72;
        const labelOnRight = offset <= 0;
        return (
          <FadeIn key={item.lesson.id} delay={i * 80} style={{ height: ROW, width: '100%' }}>
            <View style={[styles.nodeBox, { left: center - nodeWidth / 2 + offset }]}>
              {item.kind === 'done' && (
                <>
                  <Node color={colors.green} shadow={colors.greenDark} onPress={() => onPlay(item.lesson)} label={item.lesson.title}>
                    <Icon name="check" size={34} color={colors.white} strokeWidth={3.4} />
                  </Node>
                  <View style={styles.stars}>
                    {[0, 1, 2].map((s) => (
                      <Icon key={s} name="star" size={18} color={s < item.stars ? colors.yellow : '#CBD5E1'} fill={s < item.stars ? colors.yellow : '#CBD5E1'} />
                    ))}
                  </View>
                </>
              )}
              {item.kind === 'current' && <CurrentNode onPress={() => onPlay(item.lesson)} />}
              {item.kind === 'locked' && (
                <View style={styles.lockedEdge}>
                  <View style={styles.locked}>
                    <Icon name={item.last ? 'trophy' : 'lock'} size={28} color={colors.gray} strokeWidth={2.4} />
                  </View>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                { left: labelOnRight ? center + offset + nodeWidth / 2 + 12 : center + offset - nodeWidth / 2 - 12 - 104 },
                { textAlign: labelOnRight ? 'left' : 'right', color: item.kind === 'locked' ? colors.gray : colors.ink },
              ]}
            >
              {item.lesson.title}
            </Text>
          </FadeIn>
        );
      })}
      <View pointerEvents="none" style={{ position: 'absolute', top: 8 + currentIndex * ROW + 6, left: decoOffset >= 0 ? -4 : contentWidth - 80 }}>
        <Mascot name={mascot} size={50} />
      </View>
    </View>
  );
}

// Round button with a solid 6px bottom edge that sinks when pressed
function Node({ color, shadow, onPress, label, children }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={[styles.edge, { backgroundColor: shadow }]}>
      {({ pressed }) => (
        <View style={[styles.node, { backgroundColor: color }, pressed && { transform: [{ translateY: 6 }] }]}>{children}</View>
      )}
    </Pressable>
  );
}

// Yellow "JOGAR" button with a pulsing ring
function CurrentNode({ onPress }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ width: 84, height: 84 }}>
      <Animated.View
        pointerEvents="none"
        style={[styles.pulse, {
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
        }]}
      />
      <Pressable onPress={onPress} accessibilityLabel="Jogar lição" style={[styles.currentEdge]}>
        {({ pressed }) => (
          <View style={[styles.current, pressed && { transform: [{ translateY: 6 }] }]}>
            <Text style={styles.playText}>JOGAR</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  nodeBox: { position: 'absolute', top: 0, alignItems: 'center', gap: 6 },
  edge: { width: 72, height: 74, borderRadius: 37 },
  node: { width: 72, height: 68, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  lockedEdge: { width: 72, height: 74, borderRadius: 37, backgroundColor: '#CBD5E1' },
  locked: { width: 72, height: 68, borderRadius: 36, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', left: 0, top: 0, width: 84, height: 78, borderRadius: 42, backgroundColor: colors.yellow },
  currentEdge: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.yellowDark },
  current: { width: 84, height: 78, borderRadius: 39, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  playText: { fontFamily: fonts.extrabold, fontSize: 17, letterSpacing: 0.7, color: colors.ink },
  label: { position: 'absolute', top: 22, width: 104, fontFamily: fonts.bold, fontSize: 13, lineHeight: 17 },
});
