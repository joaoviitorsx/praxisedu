import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Icon, Mascot } from '../../components';
import { trailNodeLayout } from '../../features/student/trailLayout';
import { validateTrailLesson } from '../../features/teacher/classTrailModel';
import { trailSceneryHeight } from '../../features/student/trailSceneryModel';
import { colors, fonts } from '../../theme';
import useReducedMotion from '../../hooks/useReducedMotion';
import TrailScenery from '../student/TrailScenery';

const ROW_HEIGHT = 116;
const decorativeA11y = Platform.OS === 'web'
  ? { 'aria-hidden': true }
  : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };

export default function TeacherTrailMap({ lessons, mascot, onOpen, onAdd }) {
  const [width, setWidth] = useState(320);
  const pulse = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const isFocused = useIsFocused();
  const nodes = [...lessons.map((lesson, index) => ({ lesson, ready: !validateTrailLesson(lesson, index) })), { add: true }];
  const layouts = nodes.map((node, index) => trailNodeLayout(index, width, node.add ? 'current' : 'done'));
  const height = trailSceneryHeight(nodes.length, ROW_HEIGHT);
  useEffect(() => {
    if (reduceMotion || !isFocused) { pulse.setValue(0); return undefined; }
    const animation = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [pulse, reduceMotion, isFocused]);
  const paths = layouts.slice(0, -1).map((layout, index) => {
    const next = layouts[index + 1];
    const x1 = layout.nodeLeft + layout.nodeWidth / 2;
    const x2 = next.nodeLeft + next.nodeWidth / 2;
    const y1 = index * ROW_HEIGHT + 74;
    const y2 = (index + 1) * ROW_HEIGHT + 3;
    const middle = (y1 + y2) / 2;
    return { key: index, d: `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}` };
  });

  return <View style={[styles.map, { height }]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
    <View pointerEvents="none" style={styles.scenery}>
      <TrailScenery width={width} rows={nodes.length} rowHeight={ROW_HEIGHT} labelSides={layouts.map((layout) => layout.labelSide)} activeRow={lessons.length} reduceMotion={reduceMotion} isFocused={isFocused} />
    </View>
    <Svg width={width} height={nodes.length * ROW_HEIGHT} style={styles.paths} pointerEvents="none" {...decorativeA11y}>
      {paths.map((path) => <Path key={path.key} d={path.d} fill="none" stroke="#B9D7C8" strokeWidth={5} strokeLinecap="round" strokeDasharray="4 11" />)}
    </Svg>
    {nodes.map((item, index) => {
      const layout = layouts[index];
      const label = item.add ? 'Adicionar etapa' : item.lesson.title?.trim() || `Etapa ${index + 1}`;
      return <View key={item.add ? 'add' : item.lesson.id} style={[styles.row, { top: index * ROW_HEIGHT }]}>
        {item.add && !reduceMotion && isFocused && <Animated.View pointerEvents="none" style={[styles.pulse, { left: layout.nodeLeft - 8, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }]} />}
        <Pressable onPress={() => item.add ? onAdd() : onOpen(item.lesson.id)} accessibilityRole="button"
          accessibilityLabel={item.add ? 'Adicionar nova etapa' : `Editar etapa ${index + 1}: ${label}. ${item.ready ? 'Pronta' : 'Em construção'}.`}
          style={({ pressed }) => [styles.nodePosition, { left: layout.nodeLeft, width: layout.nodeWidth }, pressed && styles.pressed]}>
          <View style={[styles.nodeEdge, item.add ? styles.addEdge : item.ready ? styles.readyEdge : styles.draftEdge]}>
            <View style={[styles.node, item.add ? styles.addNode : item.ready ? styles.readyNode : styles.draftNode]}>
              {item.add ? <Icon name="plus" size={38} color={colors.ink} strokeWidth={3} />
                : <Text style={[styles.nodeNumber, item.ready && styles.readyNumber]}>{index + 1}</Text>}
            </View>
          </View>
        </Pressable>
        <View pointerEvents="none" style={[styles.labelWrap, { left: layout.labelLeft, width: layout.labelWidth, alignItems: layout.labelSide === 'left' ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.label, { textAlign: layout.labelSide === 'left' ? 'right' : 'left' }]} numberOfLines={2}>{label}</Text>
          {!item.add && <Text style={[styles.meta, item.ready && styles.readyMeta]}>{item.ready ? 'Pronta' : 'Em construção'}</Text>}
        </View>
      </View>;
    })}
    {mascot && <View pointerEvents="none" style={[styles.mascot, { top: lessons.length * ROW_HEIGHT + 62, left: layouts[lessons.length].nodeLeft > width / 2 ? 0 : Math.max(0, width - 80) }]}><Mascot name={mascot} size={50} /></View>}
  </View>;
}

const styles = StyleSheet.create({
  map: { position: 'relative', width: '100%', marginTop: 8 },
  scenery: { position: 'absolute', left: 0, top: 0 }, paths: { position: 'absolute', left: 0, top: 0 },
  row: { position: 'absolute', left: 0, right: 0, height: ROW_HEIGHT },
  nodePosition: { position: 'absolute', top: 0, zIndex: 2, alignItems: 'center' },
  nodeEdge: { width: '100%', borderRadius: 999, paddingBottom: 6 },
  addEdge: { backgroundColor: colors.yellowDark }, readyEdge: { backgroundColor: colors.greenDark }, draftEdge: { backgroundColor: colors.blueDark },
  node: { width: '100%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  addNode: { height: 78, backgroundColor: colors.yellow }, readyNode: { height: 68, backgroundColor: colors.green }, draftNode: { height: 68, backgroundColor: colors.blueSoft },
  nodeNumber: { fontFamily: fonts.extrabold, fontSize: 25, color: colors.blueDark }, readyNumber: { color: colors.white },
  pressed: { transform: [{ translateY: 5 }] },
  pulse: { position: 'absolute', top: -8, width: 100, height: 94, borderRadius: 50, backgroundColor: colors.yellow },
  labelWrap: { position: 'absolute', top: 14, gap: 4 },
  label: { fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 18, color: colors.ink },
  meta: { fontFamily: fonts.bold, fontSize: 11, color: colors.blue }, readyMeta: { color: colors.green },
  mascot: { position: 'absolute', zIndex: 3 },
});
