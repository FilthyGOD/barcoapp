/**
 * Badge — etiqueta de estado visual para reservaciones y pagos.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';
import { EstadoReservacion } from '@/src/core/types/reservacion.types';

interface BadgeProps {
  estado: EstadoReservacion | string;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pendiente: { label: 'Pendiente', bg: Colors.estadoPendienteLight, text: Colors.estadoPendiente, dot: Colors.estadoPendiente },
  pagado:    { label: 'Pagado',    bg: Colors.estadoPagadoLight,    text: Colors.estadoPagado,    dot: Colors.estadoPagado },
  aceptada:  { label: 'Aceptada', bg: '#E8F4FF',                   text: Colors.info,             dot: Colors.info },
  rechazada: { label: 'Rechazada',bg: Colors.estadoRechazadoLight,  text: Colors.estadoRechazado,  dot: Colors.estadoRechazado },
};

export function Badge({ estado, size = 'md' }: BadgeProps) {
  const config = BADGE_CONFIG[estado] ?? { label: estado, bg: Colors.neutral[100], text: Colors.textSecondary, dot: Colors.textMuted };
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text, fontSize: isSmall ? FontSize.xs : FontSize.sm }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: FontWeight.semibold,
  },
});
