import { Easing } from 'react-native-reanimated';
import { useTheme } from './theme';

export const portfolio = {
  cream: '#F6F1E9',
  raised: '#FBF8F3',
  ink: '#1A1A1A',
  accent: '#8C4A3A',
} as const;

export const motion = {
  hero: 420,
  page: 380,
  sway: 2400,
  easeOut: Easing.out(Easing.cubic),
} as const;

export const scriptFont = 'Allura_400Regular';
export const sansFont = 'Manrope_500Medium';
export const sansSemi = 'Manrope_600SemiBold';

export function usePortfolio() {
  const { dark } = useTheme();
  return dark
    ? { cream: '#101713', raised: '#1A2620', ink: '#F6F1E9', accent: '#C98A72', line: 'rgba(246,241,233,0.45)' }
    : { cream: portfolio.cream, raised: portfolio.raised, ink: portfolio.ink, accent: portfolio.accent, line: portfolio.ink };
}
