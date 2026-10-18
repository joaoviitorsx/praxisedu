import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { sceneryMotionTargets, trailSceneryForRows, trailSceneryHeight } from '../../features/student/trailSceneryModel';

const nature = {
  meadow: '#E5F5DC', meadowShade: '#CDECC5', leaf: '#77BD76', leafLight: '#A9D98C',
  leafDeep: '#459C69', trunk: '#A97657', water: '#9ADAE8', waterDeep: '#69BBD4',
  petal: '#F8B6C4', flower: '#FFE38A',
};

function Meadow() {
  return <>
    <Ellipse cx={54} cy={85} rx={57} ry={20} fill={nature.meadow} />
    <Path d="M0 85 Q28 65 55 84 Q81 64 110 84 L110 100 Q55 92 0 100 Z" fill={nature.meadowShade} opacity={0.55} />
    <Path d="M8 82 Q4 61 1 60 M17 79 Q13 54 10 50 M26 82 Q27 57 34 48 M71 82 Q68 58 65 53 M82 83 Q85 51 92 47 M96 82 Q102 61 108 58" stroke={nature.leaf} strokeWidth={3} strokeLinecap="round" fill="none" />
    <Path d="M9 74 Q0 67 0 59 M30 72 Q39 67 40 60 M83 71 Q75 61 73 57 M99 71 Q108 65 110 60" stroke={nature.leafLight} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    <Circle cx={13} cy={50} r={5} fill={nature.petal} /><Circle cx={13} cy={50} r={2} fill={nature.flower} />
    <Circle cx={90} cy={48} r={5} fill="#FAE39D" /><Circle cx={90} cy={48} r={2} fill="#F6A2A3" />
    <Ellipse cx={53} cy={88} rx={5} ry={2} fill="#C7DDBD" /><Ellipse cx={61} cy={91} rx={3} ry={2} fill="#C7DDBD" />
  </>;
}

function Tree() {
  return <>
    <Ellipse cx={54} cy={94} rx={58} ry={17} fill={nature.meadow} />
    <Path d="M50 91 Q49 69 53 53 M54 76 Q69 60 73 54" stroke={nature.trunk} strokeWidth={9} strokeLinecap="round" fill="none" />
    <Circle cx={35} cy={46} r={26} fill={nature.leafLight} />
    <Circle cx={72} cy={45} r={29} fill={nature.leaf} />
    <Circle cx={55} cy={27} r={27} fill="#94D189" />
    <Circle cx={34} cy={48} r={4} fill="#D5EDB9" /><Circle cx={75} cy={36} r={4} fill="#D5EDB9" />
    <Path d="M12 89 Q17 79 23 89 Z" fill={nature.petal} /><Path d="M17 88 V95" stroke={nature.trunk} strokeWidth={3} />
    <Circle cx={20} cy={86} r={1.5} fill="#FFFFFF" /><Circle cx={15} cy={87} r={1.5} fill="#FFFFFF" />
    <Path d="M83 94 Q88 81 92 92 M91 94 Q96 79 103 83" stroke={nature.leafDeep} strokeWidth={2.5} strokeLinecap="round" fill="none" />
    <Ellipse cx={31} cy={97} rx={5} ry={2.5} fill="#C4DDB7" />
  </>;
}

function Pond() {
  return <>
    <Ellipse cx={55} cy={77} rx={57} ry={28} fill={nature.meadowShade} />
    <Ellipse cx={55} cy={74} rx={49} ry={22} fill={nature.waterDeep} />
    <Ellipse cx={55} cy={70} rx={45} ry={18} fill={nature.water} />
    <Path d="M15 71 Q28 66 40 70 M58 79 Q73 75 89 77" stroke="#EAFBFF" strokeWidth={2.5} strokeLinecap="round" fill="none" />
    <Path d="M27 77 Q33 69 42 75 Q39 81 27 77 Z" fill={nature.leafDeep} />
    <Circle cx={40} cy={73} r={3.5} fill={nature.petal} />
    <Path d="M5 78 Q9 46 13 39 M99 79 Q98 53 104 43" stroke={nature.leafDeep} strokeWidth={3} strokeLinecap="round" fill="none" />
    <Path d="M10 57 Q0 52 1 46 M101 61 Q111 56 110 49" stroke={nature.leaf} strokeWidth={4} strokeLinecap="round" fill="none" />
    <Ellipse cx={13} cy={40} rx={3} ry={8} fill="#CDAE6C" /><Ellipse cx={104} cy={44} rx={3} ry={8} fill="#CDAE6C" />
    <Ellipse cx={20} cy={97} rx={5} ry={2.5} fill="#C9D9C2" />
  </>;
}

function MovingDetail({ kind, size }) {
  return <Svg width={size} height={size} pointerEvents="none">
    {kind === 'grass' && <G>
      <Ellipse cx={48} cy={53} rx={8} ry={5} fill="#D9B9F0" transform="rotate(-25 48 53)" />
      <Ellipse cx={61} cy={53} rx={8} ry={5} fill="#D9B9F0" transform="rotate(25 61 53)" />
      <Ellipse cx={49} cy={63} rx={7} ry={4} fill="#B899DB" transform="rotate(25 49 63)" />
      <Ellipse cx={60} cy={63} rx={7} ry={4} fill="#B899DB" transform="rotate(-25 60 63)" />
      <Path d="M54 53 V63" stroke="#70469A" strokeWidth={2.5} strokeLinecap="round" />
    </G>}
    {kind === 'tree' && <G>
      <Ellipse cx={36} cy={27} rx={7} ry={4} fill="#BCE4A8" transform="rotate(-25 36 27)" />
      <Ellipse cx={74} cy={29} rx={8} ry={4} fill="#D2EDAF" transform="rotate(25 74 29)" />
      <Ellipse cx={60} cy={12} rx={6} ry={3} fill="#C9EAA9" transform="rotate(-12 60 12)" />
    </G>}
    {kind === 'pond' && <G>
      <Path d="M30 68 Q39 64 48 68 M56 72 Q65 69 76 72" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Circle cx={85} cy={65} r={2.5} fill="#FFFFFF" />
    </G>}
  </Svg>;
}

export default function TrailScenery({ width, rows, rowHeight, labelSides, activeRow, reduceMotion, isFocused }) {
  const motifs = useMemo(() => trailSceneryForRows(rows, width, labelSides), [rows, width, labelSides]);
  const animatedRows = sceneryMotionTargets(rows, activeRow);
  const breeze = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion || !isFocused || animatedRows.length === 0) { breeze.stopAnimation(); breeze.setValue(0); return undefined; }
    breeze.setValue(0);
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(breeze, { toValue: 1, duration: 1900, useNativeDriver: true }),
      Animated.timing(breeze, { toValue: 0, duration: 1900, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [activeRow, breeze, reduceMotion, isFocused, animatedRows.length]);

  return <>
    <Svg width={width} height={trailSceneryHeight(rows, rowHeight)} style={styles.canvas} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {motifs.map(({ kind, x, y }, index) => <G key={index} transform={`translate(${x} ${y})`} opacity={0.88}>
        {kind === 'grass' && <Meadow />}
        {kind === 'tree' && <Tree />}
        {kind === 'pond' && <Pond />}
      </G>)}
    </Svg>
    {!reduceMotion && isFocused && animatedRows.map((index) => {
      const motif = motifs[index];
      return <Animated.View key={index} pointerEvents="none" style={[styles.movingDetail, {
        left: motif.x, top: motif.y, width: motif.size, height: motif.size,
        opacity: breeze.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }),
        transform: motif.kind === 'pond'
          ? [{ scaleX: breeze.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }]
          : [{ translateY: breeze.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
      }]}>
        <MovingDetail kind={motif.kind} size={motif.size} />
      </Animated.View>;
    })}
  </>;
}

const styles = StyleSheet.create({
  canvas: { position: 'absolute', left: 0, top: 0 },
  movingDetail: { position: 'absolute' },
});
