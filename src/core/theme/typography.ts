/**
 * Escala tipográfica del sistema.
 * Fuentes: sistema nativo (React Native no carga Google Fonts sin expo-font).
 * Se usa la fuente del sistema con pesos variables para una UI limpia.
 */

import { Platform } from 'react-native';

export const FontFamily = {
  // Headlines / Titles
  heading: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  // Body / Labels
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  // Monospace (folios, números de tarjeta)
  mono: Platform.select({
    ios: 'Courier New',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const FontSize = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

export const LineHeight = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.8,
};
