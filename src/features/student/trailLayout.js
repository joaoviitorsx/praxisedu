const OFFSETS = [0, 60, -50, 10, 60];

export function gradeForClass(classInfo) {
  const grade = Number(classInfo?.grade);
  return Number.isInteger(grade) && grade >= 1 && grade <= 3 ? grade : null;
}

export function trailNodeLayout(index, width, kind) {
  const nodeWidth = kind === 'current' ? 84 : 72;
  const labelWidth = Math.min(104, Math.max(72, width - nodeWidth - 24));
  const offset = OFFSETS[index % OFFSETS.length];
  const labelSide = offset > 0 ? 'left' : 'right';
  const desiredLeft = width / 2 + offset - nodeWidth / 2;
  const nodeLeft = labelSide === 'left'
    ? Math.min(width - nodeWidth, Math.max(labelWidth + 12, desiredLeft))
    : Math.max(0, Math.min(width - nodeWidth - labelWidth - 12, desiredLeft));
  const labelLeft = labelSide === 'left' ? nodeLeft - labelWidth - 12 : nodeLeft + nodeWidth + 12;
  return { nodeLeft, nodeWidth, labelLeft, labelWidth, labelSide };
}
