/**
 * Dashboard — Rol ADMIN.
 * Métricas del día + lista de reservaciones con opciones de aceptar/rechazar.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppStore } from '@/src/core/store/AppContext';
import { Reservacion } from '@/src/core/types/reservacion.types';
import {
  reservacionesDeHoy,
  ingresosDeHoy,
  tendenciaMensual,
} from '@/src/core/services/reservaciones.service';
import {
  formatMXN,
  formatFecha,
  getIniciales,
  nombrePaquete,
} from '@/src/core/utils/formatters';
import { generateId } from '@/src/core/utils/formatters';
import { Card } from '@/src/shared/components/ui/Card';
import { Badge } from '@/src/shared/components/ui/Badge';
import { Modal } from '@/src/shared/components/ui/Modal';
import { Button } from '@/src/shared/components/ui/Button';
import { BitacoraSection } from '@/src/shared/components/layout/BitacoraSection';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

export default function AdminDashboard() {
  const { state, dispatch, registrarBitacora } = useAppStore();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const deHoy      = useMemo(() => reservacionesDeHoy(state.reservaciones), [state.reservaciones]);
  const ingresos   = useMemo(() => ingresosDeHoy(state.reservaciones), [state.reservaciones]);
  const pendientes = useMemo(() => state.reservaciones.filter(r => r.estado === 'pendiente').length, [state.reservaciones]);
  const tendencia  = useMemo(() => tendenciaMensual(state.reservaciones), [state.reservaciones]);

  // Máximo ingreso para escalar barras
  const maxIngreso = Math.max(...tendencia.map(t => t.ingresos), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        {!isWide && (
          <LinearGradient
            colors={[Colors.primary[400], Colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View>
              <Text style={styles.greeting}>Buenos días, {state.user?.name?.split(' ')[0]} 👋</Text>
              <Text style={styles.subtitle}>Resumen del día · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            </View>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>
                {getIniciales(state.user?.name ?? 'CM')}
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* ── Métricas ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricRow}>
          <MetricCard
            icon="calendar"
            iconColor={Colors.secondary[500]}
            iconBg={Colors.secondary[50]}
            label="Reservaciones hoy"
            value={String(deHoy.length)}
            sub={`${pendientes} pendientes de revisión`}
          />
          <MetricCard
            icon="cash"
            iconColor={Colors.success}
            iconBg={Colors.successLight}
            label="Ingresos del día"
            value={formatMXN(ingresos)}
            sub="Solo reservaciones pagadas"
          />
          <MetricCard
            icon="time"
            iconColor={Colors.warning}
            iconBg={Colors.warningLight}
            label="Próxima salida"
            value="5:30 PM"
            sub={`${deHoy.filter(r => r.horaPaseo === '17:30').reduce((s, r) => s + r.numPersonas, 0)} personas`}
          />
        </ScrollView>

        {/* ── Bitácora de Actividad ── */}
        <BitacoraSection entradas={state.bitacora} />

        {/* ── Tendencia mensual ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tendencia Mensual</Text>
          <Card>
            <View style={styles.chartWrap}>
              {tendencia.map((item, i) => (
                <View key={i} style={styles.bar}>
                  <View
                    style={[
                      styles.barFill,
                      { height: Math.max(4, (item.ingresos / maxIngreso) * 80) },
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.mes}</Text>
                  {item.ingresos > 0 && (
                    <Text style={styles.barValue}>{formatMXN(item.ingresos).replace('MX$', '$')}</Text>
                  )}
                </View>
              ))}
            </View>
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── MetricCard ─────────────────────────────────────────────────────────────────

function MetricCard({
  icon, iconColor, iconBg, label, value, sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </Card>
  );
}



// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
  },
  greeting: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  subtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.tertiary[500],
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },

  metricRow: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[3] },
  metricCard: { width: 170, gap: Spacing[2] },
  metricIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  metricValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  metricSub: { fontSize: FontSize.xs, color: Colors.textMuted },

  section: { paddingHorizontal: Spacing[4], marginBottom: Spacing[4] },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[3] },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },

  searchMini: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.white, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing[3], paddingVertical: 6,
    flex: 0.6,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, paddingVertical: 0 },

  // Gráfica de barras custom
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, paddingTop: Spacing[2] },
  bar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barFill: { width: '60%', backgroundColor: Colors.secondary[400], borderRadius: 4 },
  barLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  barValue: { fontSize: 9, color: Colors.secondary[600], fontWeight: FontWeight.semibold },


});
