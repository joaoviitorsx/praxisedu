import Svg, { G, Path, Circle, Ellipse } from 'react-native-svg';

// Mito mascot ("feliz" pose), ported from the design system's Mito.dc.html.
const OL = '#1E1A3A', CHEEK = '#FF8E8E', TICK = '#FFA928', TONGUE = '#FF6F7D';
const ORANGE = '#8B5CF6', RIM = '#6D3FD9', CREAM = '#F3EEFF', FOLD = '#F9A8D4', FOLD_E = '#E879B9', HI = '#C4B0FF';
const BODY = 'M58 10 C78 8 92 22 94 40 C96 52 104 60 104 76 C104 98 86 112 64 112 C40 112 30 96 28 78 C26 60 30 44 34 32 C38 18 46 11 58 10 Z';
const INNER = 'M58 21 C73 20 83 30 85 44 C87 56 94 64 94 78 C94 93 81 102 64 102 C47 102 39 92 38 78 C37 63 40 49 43 37 C46 27 51 22 58 21 Z';
const FOLDS = ['M63 22 C60 28 70 30 67 36', 'M39 45 C46 44 47 51 41 53', 'M39 80 C46 79 48 86 43 90', 'M52 101 C54 95 61 98 63 93 C65 89 72 92 75 89', 'M93 70 C87 69 86 76 81 75'];

// line with rounded ends
const P = (key, d, o = {}) => (
  <Path key={key} d={d} fill="none" stroke={OL} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" {...o} />
);

export default function Mito({ size = 100 }) {
  const halo = [], art = [], face = [];
  let n = 0;
  const k = () => `k${n++}`;

  const limb = (d) => {
    halo.push(P(k(), d, { stroke: '#fff', strokeWidth: 20 }));
    art.push(P(k(), d, { strokeWidth: 11.5 }), P(k(), d, { stroke: ORANGE, strokeWidth: 6 }));
  };
  const shine = (x, y, r) => (
    <Ellipse key={k()} cx={x - r * 0.3} cy={y - r * 0.38} rx={r * 0.42} ry={r * 0.26} fill={HI} transform={`rotate(-25 ${x} ${y})`} />
  );
  const fist = (x, y, r = 7) => {
    halo.push(<Circle key={k()} cx={x} cy={y} r={r + 5} fill="#fff" />);
    art.push(<Circle key={k()} cx={x} cy={y} r={r} fill={ORANGE} stroke={OL} strokeWidth={3.2} />, shine(x, y, r));
  };
  const open = (x, y, rot) => {
    const f = [[-5.5, -6.5], [0, -8.8], [5.5, -6.5]];
    halo.push(
      <G key={k()} transform={`rotate(${rot} ${x} ${y})`}>
        <Circle cx={x} cy={y} r={12} fill="#fff" />
        {f.map(([dx, dy], i) => <Circle key={i} cx={x + dx} cy={y + dy} r={7.5} fill="#fff" />)}
      </G>
    );
    art.push(
      <G key={k()} transform={`rotate(${rot} ${x} ${y})`}>
        {f.map(([dx, dy], i) => <Ellipse key={`f${i}`} cx={x + dx} cy={y + dy} rx={3.3} ry={4} fill={ORANGE} stroke={OL} strokeWidth={2.8} />)}
        <Circle cx={x - 7.5} cy={y + 1.5} r={3.4} fill={ORANGE} stroke={OL} strokeWidth={2.8} />
        <Circle cx={x} cy={y} r={7} fill={ORANGE} />
        <Path d={`M${x - 7} ${y - 1} A7 7 0 1 0 ${x + 7} ${y - 1}`} fill="none" stroke={OL} strokeWidth={3} />
        {shine(x, y + 2, 6)}
      </G>
    );
  };
  const foot = (x, y, rx, ry) => {
    halo.push(<Ellipse key={k()} cx={x} cy={y} rx={rx + 5} ry={ry + 5} fill="#fff" />);
    art.push(<Ellipse key={k()} cx={x} cy={y} rx={rx} ry={ry} fill={ORANGE} stroke={OL} strokeWidth={3.2} />, shine(x, y, ry));
  };
  const cheek = (x, y) => face.push(
    <Ellipse key={k()} cx={x} cy={y} rx={5.6} ry={3.9} fill={CHEEK} opacity={0.85} />,
    P(k(), `M${x - 2} ${y + 1.2} l1.3 -2.2 M${x + 0.6} ${y + 1.2} l1.3 -2.2`, { stroke: '#fff', strokeWidth: 1.1, opacity: 0.85 })
  );

  // arms, legs and feet
  limb('M33 66 Q22 76 24 88'); fist(24, 91);
  limb('M100 62 Q113 54 113 40'); open(113, 35, 12);
  limb('M48 108 Q42 114 36 115'); limb('M72 110 Q75 115 78 117');
  foot(34, 115, 8.5, 6.5); foot(80, 117.5, 8.5, 6);

  // body
  halo.push(<Path key={k()} d={BODY} fill="#fff" stroke="#fff" strokeWidth={12} strokeLinejoin="round" />);
  art.push(
    <Path key={k()} d={BODY} fill={ORANGE} stroke={OL} strokeWidth={3.6} strokeLinejoin="round" />,
    P(k(), 'M36 84 C40 100 52 108 66 108 C84 108 98 96 100 80', { stroke: RIM, strokeWidth: 5, opacity: 0.7 }),
    <Path key={k()} d={INNER} fill={CREAM} stroke={RIM} strokeWidth={2.6} />
  );
  FOLDS.forEach((d) => art.push(P(k(), d, { stroke: FOLD_E, strokeWidth: 10 }), P(k(), d, { stroke: FOLD, strokeWidth: 6.4 })));
  art.push(
    <Ellipse key={k()} cx={47} cy={19} rx={7} ry={2.6} fill={HI} transform="rotate(-30 47 19)" />,
    <Ellipse key={k()} cx={33.5} cy={50} rx={1.9} ry={5} fill={HI} transform="rotate(12 33.5 50)" />
  );

  // face: winking eye, eyebrows, open smile, cheeks
  face.push(
    P(k(), 'M48.5 60.5 q5.5 -6 11 0', { strokeWidth: 3.6 }),
    <Ellipse key={k()} cx={75} cy={57} rx={6.2} ry={7.6} fill={OL} />,
    <Circle key={k()} cx={73.3} cy={54.4} r={2.6} fill="#fff" />,
    <Circle key={k()} cx={77} cy={59.8} r={1.2} fill="#fff" />,
    P(k(), 'M70 46.5 q5.5 -5 11 -1'), P(k(), 'M48 51 q5.5 -3 10 -0.5'),
    <Path key={k()} d="M57.5 66.5 Q65 64.5 72.5 64 Q73 77 65.5 77.5 Q58.5 77.5 57.5 66.5 Z" fill={OL} stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />,
    <Path key={k()} d="M61 72.5 Q65.5 70 70 72 L69.5 79 Q66 82.5 62.5 79.5 Z" fill={TONGUE} stroke={OL} strokeWidth={2.2} strokeLinejoin="round" />,
    P(k(), 'M65.6 73 v4.5', { stroke: '#E0475A', strokeWidth: 1.3 })
  );
  cheek(47, 69); cheek(83, 65);

  return (
    <Svg width={size} height={size} viewBox="0 4 120 120" style={{ overflow: 'visible' }}>
      <Ellipse cx={60} cy={122} rx={32} ry={4} fill={OL} opacity={0.13} />
      <G transform="rotate(-5 64 112)">{halo}{art}{face}</G>
      {P('t1', 'M120 26 q4 6 1 13', { stroke: TICK, strokeWidth: 3.4 })}
      {P('t2', 'M125 22 q5 9 1 19', { stroke: TICK, strokeWidth: 3.4 })}
    </Svg>
  );
}
