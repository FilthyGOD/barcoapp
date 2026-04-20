/**
 * Componente Button reutilizable con variantes y estados.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary[500] : Colors.white}
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variantes
  primary: { backgroundColor: Colors.primary[500] },
  secondary: { backgroundColor: Colors.secondary[500] },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary[500],
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.danger },

  // Tamaños
  size_sm: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] - 2 },
  size_md: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  size_lg: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[4] },

  // Texto
  text: { textAlign: 'center' },
  text_primary:  { color: Colors.white,        fontWeight: FontWeight.semibold },
  text_secondary:{ color: Colors.white,        fontWeight: FontWeight.semibold },
  text_outline:  { color: Colors.primary[500], fontWeight: FontWeight.semibold },
  text_ghost:    { color: Colors.primary[500], fontWeight: FontWeight.medium },
  text_danger:   { color: Colors.white,        fontWeight: FontWeight.semibold },

  textSize_sm: { fontSize: FontSize.sm },
  textSize_md: { fontSize: FontSize.base },
  textSize_lg: { fontSize: FontSize.md },
});
