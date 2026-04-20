/**
 * Dashboard — Rol USUARIO (Tripulante).
 * Métricas del día + reservaciones recientes + FAB nueva reservación.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppStore } from '@/src/core/store/AppContext';
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
import { Card } from '@/src/shared/components/ui/Card';
import { Badge } from '@/src/shared/components/ui/Badge';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

export default function UsuarioDashboard() {
  const { state, dispatch, registrarBitacora } = useAppStore();
  const router = useRouter();

  const handleLogout = () => {
    const performLogout = () => {
      registrarBitacora('LOGOUT', `Cierre de sesión — ${state.user?.name ?? 'Usuario'}`);
      dispatch({ type: 'LOGOUT' });
      setTimeout(() => router.replace('/login'), 100);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar Sesión', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const deHoy = useMemo(() => reservacionesDeHoy(state.reservaciones), [state.reservaciones]);
  const ingresos = useMemo(() => ingresosDeHoy(state.reservaciones), [state.reservaciones]);
  const recientes = useMemo(
    () => [...state.reservaciones].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [state.reservaciones],
  );
  const tendencia = useMemo(() => tendenciaMensual(state.reservaciones), [state.reservaciones]);
  const maxIngreso = Math.max(...tendencia.map(t => t.ingresos), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bienvenida, {state.user?.name?.split(' ')[0]} ⚓</Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{getIniciales(state.user?.name ?? 'AV')}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutHeaderBtn} activeOpacity={0.8}>
              <Ionicons name="log-out" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Métricas ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricRow}>
          <MetricCard
            icon="calendar"
            iconColor={Colors.secondary[500]}
            iconBg={Colors.secondary[50]}
            label="Mis reservaciones hoy"
            value={String(deHoy.length)}
            sub="Registradas hoy"
          />
          {/* <MetricCard
            icon="cash"
            iconColor={Colors.success}
            iconBg={Colors.successLight}
            label="Ingresos del día"
            value={formatMXN(ingresos)}
            sub="Pagadas hoy"
          /> */}
          {/* <MetricCard
            icon="people"
            iconColor={Colors.tertiary[500]}
            iconBg={Colors.tertiary[50]}
            label="Personas hoy"
            value={String(deHoy.reduce((s, r) => s + r.numPersonas, 0))}
            sub="Total pasajeros"
          /> */}
        </ScrollView>

        {/* ── Tendencia ── */}
        {/* <View style={styles.section}>
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
                </View>
              ))}
            </View>
          </Card>
        </View> */}

        {/* ── Reservaciones recientes ── */}
        <View style={[styles.section, { paddingBottom: 96 }]}>
          <Text style={styles.sectionTitle}>Reservaciones Recientes</Text>
          {recientes.map(res => (
            <TouchableOpacity
              key={res.id}
              onPress={() => router.push(`/(usuario)/reservaciones/${res.id}`)}
              activeOpacity={0.8}
            >
              <Card style={styles.resCard}>
                <View style={styles.resTop}>
                  <View style={styles.resAvatar}>
                    <Text style={styles.resAvatarText}>{getIniciales(res.clienteNombre)}</Text>
                  </View>
                  <View style={styles.resInfo}>
                    <Text style={styles.resFolio}>{res.folio}</Text>
                    <Text style={styles.resNombre}>{res.clienteNombre}</Text>
                    <Text style={styles.resDetalle}>
                      {formatFecha(res.fechaPaseo)} · {res.horaPaseo} · {nombrePaquete(res.paquete)}
                    </Text>
                  </View>
                  <View style={styles.resRight}>
                    <Text style={styles.resTotal}>{formatMXN(res.total)}</Text>
                    <Badge estado={res.estado} size="sm" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── FAB: Nueva Reservación ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(usuario)/reservaciones/nueva')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
        <Text style={styles.fabText}>Nueva Reservación</Text>
      </TouchableOpacity>
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
    backgroundColor: Colors.primary[500],
  },
  greeting: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  subtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.secondary[500],
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  logoutHeaderBtn: {
    padding: Spacing[2],
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
  },

  metricRow: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[3] },
  metricCard: { width: 165, gap: Spacing[2] },
  metricIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  metricValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  metricSub: { fontSize: FontSize.xs, color: Colors.textMuted },

  section: { paddingHorizontal: Spacing[4], marginBottom: Spacing[3] },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[3] },

  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, paddingTop: Spacing[2] },
  bar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barFill: { width: '60%', backgroundColor: Colors.secondary[400], borderRadius: 4 },
  barLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  resCard: { marginBottom: Spacing[2] },
  resTop: { flexDirection: 'row', gap: Spacing[3] },
  resAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center', alignItems: 'center',
  },
  resAvatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  resInfo: { flex: 1 },
  resFolio: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  resNombre: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  resDetalle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  resRight: { alignItems: 'flex-end', gap: 4 },
  resTotal: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary[500] },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: Spacing[4],
    backgroundColor: Colors.secondary[500],
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    elevation: 8,
    shadowColor: Colors.secondary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
});
