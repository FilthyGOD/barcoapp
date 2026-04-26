/**
 * Paleta de colores del Sistema de Reservaciones — Barco Pirata de Puerto Peñasco
 * Derivada del mockup de diseño aprobado.
 */

export const Colors = {
  // Azul marino profundo — color primario
  primary: {
    50: '#f0f2f5',
    100: '#b3cde0',
    200: '#80abcc',
    300: '#4d8ab8',
    400: '#2d6fa4',
    500: '#00416A', // Principal
    600: '#003a5f',
    700: '#003052',
    800: '#002645',
    900: '#001a30',
  },

  // Turquesa/Teal — color secundario
  secondary: {
    50: '#e0f5f5',
    100: '#b3e6e6',
    200: '#80d6d6',
    300: '#4dc6c6',
    400: '#26b9b9',
    500: '#00A3A3', // Principal
    600: '#009292',
    700: '#007e7e',
    800: '#006a6a',
    900: '#004a4a',
  },

  // Dorado — color terciario/acento
  tertiary: {
    50: '#f9f2e3',
    100: '#eedeb8',
    200: '#e3c98a',
    300: '#d8b45c',
    400: '#cfa538',
    500: '#C5A059', // Principal
    600: '#b08a3a',
    700: '#8a6b2d',
    800: '#634d20',
    900: '#3d2f13',
  },

  // Neutral
  neutral: {
    50: '#F4F7F9',
    100: '#E8EDF2',
    200: '#D1DCE5',
    300: '#B0C1CE',
    400: '#8EA5B4',
    500: '#6B8898',
    600: '#4E6878',
    700: '#374D5A',
    800: '#22333E',
    900: '#0F1A21',
  },

  // Semánticos
  success: '#22A06B',
  successLight: '#E3FCEF',
  warning: '#FF8B00',
  warningLight: '#FFF4E5',
  danger: '#E5484D',
  dangerLight: '#FFECEC',
  info: '#0091FF',
  infoLight: '#E8F4FF',

  // Base
  white: '#FFFFFF',
  black: '#0A0A0A',
  background: '#F4F7F9',
  surface: '#FFFFFF',
  border: '#E8EDF2',
  textPrimary: '#0F1A21',
  textSecondary: '#4E6878',
  textMuted: '#8EA5B4',

  // Estados de reservación
  estadoPendiente: '#FF8B00',
  estadoPendienteLight: '#FFF4E5',
  estadoPagado: '#22A06B',
  estadoPagadoLight: '#E3FCEF',
  estadoRechazado: '#E5484D',
  estadoRechazadoLight: '#FFECEC',
};

export type ColorKey = keyof typeof Colors;
