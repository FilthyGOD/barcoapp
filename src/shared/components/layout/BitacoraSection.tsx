/**
 * BitacoraSection — Sección de bitácora para el dashboard.
 * Muestra las últimas entradas de actividad del sistema.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/src/shared/components/ui/Card';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';
import { BitacoraEntry, BitacoraTipo, ETIQUETA_BITACORA } from '@/src/core/types/bitacora.types';

// ── Íconos y colores por tipo de evento ──────────────────────────────────────

const TIPO_CONFIG: Record<BitacoraTipo, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}> = {
  RESERVACION_CREADA:    { icon: 'add-circle',      color: Colors.success,   bg: Colors.successLight },
  RESERVACION_EDITADA:   { icon: 'create',           color: Colors.info,      bg: Colors.infoLight },
  RESERVACION_ELIMINADA: { icon: 'trash',            color: Colors.danger,    bg: Colors.dangerLight },
  RESERVACION_ACEPTADA:  { icon: 'checkmark-circle', color: Colors.success,   bg: Colors.successLight },
  RESERVACION_RECHAZADA: { icon: 'close-circle',     color: Colors.danger,    bg: Colors.dangerLight },
  PAGO_PROCESADO:        { icon: 'cash',             color: '#22A06B',        bg: '#E3FCEF' },
  CONFIG_MODIFICADA:     { icon: 'settings',         color: Colors.warning,   bg: Colors.warningLight },
  LOGIN:                 { icon: 'log-in',           color: Colors.primary[500], bg: Colors.primary[50] },
  LOGOUT:                { icon: 'log-out',          color: Colors.neutral[600], bg: Colors.neutral[50] },
};

// ── Tiempo relativo ──────────────────────────────────────────────────────────

function tiempoRelativo(isoDate: string): string {
  const ahora = Date.now();
  const fecha = new Date(isoDate).getTime();
  const diff = ahora - fecha;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'justo ahora';
  if (mins < 60) return `hace ${mins} min`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;

  const dias = Math.floor(hrs / 24);
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;

  return new Date(isoDate).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

// ── Componente ───────────────────────────────────────────────────────────────

interface Props {
  entradas: BitacoraEntry[];
  maxEntradas?: number;
}

export function BitacoraSection({ entradas, maxEntradas = 5 }: Props) {
  const recientes = entradas.slice(0, maxEntradas);

  if (recientes.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bitácora de Actividad</Text>
        <Card>
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Sin actividad registrada</Text>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bitácora de Actividad</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{entradas.length}</Text>
        </View>
      </View>
      <Card style={styles.card}>
        {recientes.map((entry, i) => {
          const config = TIPO_CONFIG[entry.tipo] ?? TIPO_CONFIG.LOGIN;
          const isLast = i === recientes.length - 1;

          return (
            <View key={entry.id} style={[styles.row, !isLast && styles.rowBorder]}>
              {/* Ícono */}
              <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon} size={16} color={config.color} />
              </View>

              {/* Contenido */}
              <View style={styles.content}>
                <View style={styles.topRow}>
                  <View style={[styles.tipoBadge, { backgroundColor: config.bg }]}>
                    <Text style={[styles.tipoBadgeText, { color: config.color }]}>
                      {ETIQUETA_BITACORA[entry.tipo] ?? entry.tipo}
                    </Text>
                  </View>
                  <Text style={styles.tiempo}>{tiempoRelativo(entry.createdAt)}</Text>
                </View>
                <Text style={styles.descripcion} numberOfLines={2}>
                  {entry.descripcion}
                </Text>
                <Text style={styles.usuario}>por {entry.usuario}</Text>
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  card: {
    paddingVertical: Spacing[1],
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tipoBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  tiempo: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  descripcion: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  usuario: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[6],
    gap: Spacing[2],
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
