export const colors = {
  ink: '#1A1A2E',
  yellow: '#FFC53D',
  yellowDark: '#D99A1E',
  yellowSoft: '#FFF4D6',
  purple: '#7C3AED',
  purpleDark: '#5B21B6',
  purpleSoft: '#F3EEFF',
  blue: '#1D4ED8',
  blueDark: '#1E3A8A',
  blueSoft: '#EAF0FF',
  green: '#087A45',
  greenDark: '#05592F',
  greenSoft: '#E7F6EE',
  orange: '#F97316',
  orangeText: '#C2410C',
  orangeSoft: '#FFEDD5',
  red: '#DC2626',
  redDark: '#991B1B',
  redSoft: '#FDECEC',
  redText: '#B91C1C',
  gray: '#475569',
  border: '#E2E8F0',
  background: '#F7F7FA',
  surface: '#FFFFFF',
  white: '#FFFFFF',
};

// Plus Jakarta Sans weights (loaded in App.js)
export const fonts = {
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

// Ready-made text styles
export const text = {
  display: { fontFamily: fonts.extrabold, fontSize: 32, color: colors.ink },
  h1: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.ink },
  h2: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
  body: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  label: { fontFamily: fonts.extrabold, fontSize: 13, letterSpacing: 0.8, color: colors.gray, textTransform: 'uppercase' },
  caption: { fontFamily: fonts.semibold, fontSize: 13, color: colors.gray },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, screen: 20 };

export const radius = { card: 20, block: 16, button: 14, pill: 999 };
