/**
 * Card — contenedor con sombra y esquinas redondeadas.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/src/core/theme/colors';
import { BorderRadius, Shadow, Spacing } from '@/src/core/theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
}

export function Card({ children, style, padding = true }: CardProps) {
  return (
    <View style={[styles.card, padding && styles.padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  padding: {
    padding: Spacing[4],
  },
});
