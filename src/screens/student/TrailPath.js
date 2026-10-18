import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Icon, Mascot } from '../../components';
import { trailNodeLayout } from '../../features/student/trailLayout';
import { colors, fonts } from '../../theme';
import TrailScenery from './TrailScenery';
import useReducedMotion from '../../hooks/useReducedMotion';
import { trailSceneryHeight } from '../../features/student/trailSceneryModel';
export { lessonStates } from '../../features/student/trailModel';

const ROW_HEIGHT = 116;

export default function TrailPath({ items, mascot, onPlay }) {
  const [width, setWidth] = useState(320);
  const pulse = useRef(new Animated.Value(0)).current;
  const sceneEnter = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const isFocused = useIsFocused();
  const layouts = items.map(({ kind }, index) => trailNodeLayout(index, width, kind));
  const currentIndex = items.findIndex((item) => item.kind === 'current');
  const firstLessonId = items[0]?.lesson.id;

  useEffect(() => {
    if (reduceMotion) { sceneEnter.setValue(1); return undefined; }
    sceneEnter.setValue(0);
    const animation = Animated.timing(sceneEnter, { toValue: 1, duration: 360, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [sceneEnter, reduceMotion, mascot, firstLessonId]);

  useEffect(() => {
    if (currentIndex < 0 || reduceMotion || !isFocused) { pulse.setValue(0); return undefined; }
    const animation = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [currentIndex, pulse, reduceMotion, isFocused]);

  const paths = layouts.slice(0, -1).map((layout, index) => {
    const next = layouts[index + 1];
    const x1 = layout.nodeLeft + layout.nodeWidth / 2;
    const x2 = next.nodeLeft + next.nodeWidth / 2;
    const y1 = index * ROW_HEIGHT + (items[index].kind === 'current' ? 84 : 74);
    const y2 = (index + 1) * ROW_HEIGHT + 3;
    const middle = (y1 + y2) / 2;
    return { id: items[index].lesson.id, d: `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`, done: items[index].kind === 'done' };
  });

  return (
    <View style={[styles.map, { height: trailSceneryHeight(items.length, ROW_HEIGHT) }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Animated.View pointerEvents="none" style={[styles.scenery, { width, height: trailSceneryHeight(items.length, ROW_HEIGHT), opacity: sceneEnter, transform: [{ translateY: sceneEnter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
        <TrailScenery width={width} rows={items.length} rowHeight={ROW_HEIGHT} labelSides={layouts.map((layout) => layout.labelSide)} activeRow={currentIndex} reduceMotion={reduceMotion} isFocused={isFocused} />
      </Animated.View>
      <Svg width={width} height={items.length * ROW_HEIGHT} style={styles.paths} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {paths.map((path) => <Path key={path.id} d={path.d} fill="none" stroke={path.done ? '#B7E2CA' : '#CBD5E1'} strokeWidth={5} strokeLinecap="round" strokeDasharray="4 11" />)}
      </Svg>
      {items.map(({ lesson, kind, stars }, index) => {
        const layout = layouts[index];
        const done = kind === 'done';
        const current = kind === 'current';
        const node = (
          <View style={[styles.nodeEdge, current ? styles.currentEdge : done ? styles.doneEdge : styles.lockedEdge]}>
            <View style={[styles.node, current ? styles.currentNode : done ? styles.doneNode : styles.lockedNode]}>
              {current ? <Text style={styles.playText}>JOGAR</Text> : <Icon name={done ? 'check' : index === items.length - 1 ? 'trophy' : 'lock'} size={done ? 34 : 28} strokeWidth={done ? 3.4 : 2.4} color={done ? colors.white : colors.gray} />}
            </View>
          </View>
        );
        return (
          <View key={lesson.id} style={[styles.row, { top: index * ROW_HEIGHT }]}>
            {current && !reduceMotion && isFocused && <Animated.View pointerEvents="none" style={[styles.pulse, { left: layout.nodeLeft - 8, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }]} />}
            {kind === 'locked' ? (
              <View accessible accessibilityLabel={`${lesson.title}, bloqueada. Conclua a lição anterior.`} style={[styles.nodePosition, { left: layout.nodeLeft, width: layout.nodeWidth }]}>{node}</View>
            ) : (
              <Pressable onPress={() => onPlay(lesson)} accessibilityRole="button" accessibilityLabel={`${lesson.title}, ${done ? 'concluída, jogar novamente' : 'próxima lição, jogar'}`} style={({ pressed }) => [styles.nodePosition, { left: layout.nodeLeft, width: layout.nodeWidth }, pressed && styles.pressed]}>{node}</Pressable>
            )}
            {done && <View pointerEvents="none" style={[styles.stars, { left: layout.nodeLeft + (layout.nodeWidth - 58) / 2 }]}>{[0, 1, 2].map((star) => <Icon key={star} name="star" size={18} strokeWidth={1.6} color={star < stars ? colors.yellow : '#CBD5E1'} fill={star < stars ? colors.yellow : '#CBD5E1'} />)}</View>}
            <Text pointerEvents="none" style={[styles.label, { left: layout.labelLeft, width: layout.labelWidth, textAlign: layout.labelSide === 'left' ? 'right' : 'left' }, kind === 'locked' && styles.lockedLabel]}>{lesson.title}</Text>
          </View>
        );
      })}
      {currentIndex >= 0 && mascot && <View pointerEvents="none" style={[styles.mascot, { top: currentIndex * ROW_HEIGHT + 62, left: layouts[currentIndex].nodeLeft > width / 2 ? 0 : Math.max(0, width - 80) }]}><Mascot name={mascot} size={50} /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { position: 'relative', width: '100%', marginTop: 4 },
  scenery: { position: 'absolute', top: 0, left: 0, right: 0 },
  paths: { position: 'absolute', top: 0, left: 0 },
  row: { position: 'absolute', left: 0, right: 0, height: ROW_HEIGHT },
  nodePosition: { position: 'absolute', top: 0, zIndex: 2, alignItems: 'center' },
  nodeEdge: { width: '100%', borderRadius: 999, paddingBottom: 6 },
  doneEdge: { backgroundColor: colors.greenDark },
  currentEdge: { backgroundColor: colors.yellowDark },
  lockedEdge: { backgroundColor: '#CBD5E1' },
  node: { width: '100%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  doneNode: { height: 68, backgroundColor: colors.green },
  currentNode: { height: 78, backgroundColor: colors.yellow },
  lockedNode: { height: 68, backgroundColor: colors.border },
  playText: { fontFamily: fonts.extrabold, fontSize: 17, letterSpacing: 0.6, color: colors.ink },
  pressed: { transform: [{ translateY: 5 }] },
  pulse: { position: 'absolute', top: -8, width: 100, height: 94, borderRadius: 50, backgroundColor: colors.yellow },
  label: { position: 'absolute', top: 22, fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, color: colors.ink },
  lockedLabel: { color: colors.gray },
  stars: { position: 'absolute', top: 83, width: 58, flexDirection: 'row', justifyContent: 'space-between' },
  mascot: { position: 'absolute', zIndex: 3 },
});
