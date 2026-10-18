const EDGE = 12;
const GAP = 10;
const ARROW_SIZE = 14;

export function placeStatPopover(anchor, viewport, preferredWidth = 300, estimatedHeight = 190) {
  const width = Math.min(preferredWidth, Math.max(0, viewport.width - EDGE * 2));
  const center = anchor.x + anchor.width / 2;
  const left = Math.max(EDGE, Math.min(center - width / 2, viewport.width - width - EDGE));
  const below = anchor.y + anchor.height + GAP;
  const aboveTop = anchor.y - estimatedHeight - GAP;
  const above = below + estimatedHeight > viewport.height - EDGE && aboveTop >= EDGE;
  const top = above ? aboveTop : Math.min(below, Math.max(EDGE, viewport.height - estimatedHeight - EDGE));
  const arrowLeft = Math.max(14, Math.min(center - left - ARROW_SIZE / 2, width - 28));
  return { left, top, width, arrowLeft, above };
}
