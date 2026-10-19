const ROW_HEIGHT = 116;
const MOTIFS = ['grass', 'tree', 'pond', 'grove'];
const MOTIF_SIZE = 110;

export function trailSceneryHeight(count, rowHeight) {
  return count <= 0 ? 0 : count * rowHeight + 32;
}

export function trailSceneryForRows(count, width, labelSides = []) {
  return Array.from({ length: Math.max(0, count) }, (_, index) => ({
    kind: MOTIFS[index % MOTIFS.length],
    x: (labelSides[index] ?? (index % 2 === 0 ? 'right' : 'left')) === 'right' ? 0 : Math.max(0, width - MOTIF_SIZE),
    y: index * ROW_HEIGHT + 38,
    size: MOTIF_SIZE,
  }));
}

export function sceneryMotionTargets(count, activeIndex) {
  if (count <= 0 || activeIndex < 0) return [];
  const current = Math.min(count - 1, activeIndex);
  return current < count - 1 ? [current, current + 1] : [current - 1, current].filter((index) => index >= 0);
}
