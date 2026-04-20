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
} from 'react-native';
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
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

export default function AdminDashboard() {
  const { state, dispatch, registrarBitacora } = useAppStore();
  const { width } = useWindowDimensions();

  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Reservacion | null>(null);
  const [accion, setAccion]           = useState<'aceptar' | 'rechazar' | null>(null);
  const [nota, setNota]               = useState('');

  const deHoy      = useMemo(() => reservacionesDeHoy(state.reservaciones), [state.reservaciones]);
  const ingresos   = useMemo(() => ingresosDeHoy(state.reservaciones), [state.reservaciones]);
  const pendientes = useMemo(() => state.reservaciones.filter(r => r.estado === 'pendiente').length, [state.reservaciones]);
  const tendencia  = useMemo(() => tendenciaMensual(state.reservaciones), [state.reservaciones]);

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return state.reservaciones
      .filter(r =>
        !q || r.folio.toLowerCase().includes(q) || r.clienteNombre.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [state.reservaciones, busqueda]);

  const abrirAccion = (res: Reservacion, tipo: 'aceptar' | 'rechazar') => {
    setSelectedRes(res);
    setAccion(tipo);
    setNota('');
    setModalVisible(true);
  };

  const confirmarAccion = () => {
    if (!selectedRes || !accion) return;
    const nuevoEstado = accion === 'aceptar' ? 'aceptada' : 'rechazada';
    const updated: Reservacion = {
      ...selectedRes,
      estado: nuevoEstado,
      notaAdmin: nota.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE_RESERVACION', payload: updated });
    registrarBitacora(
      accion === 'aceptar' ? 'RESERVACION_ACEPTADA' : 'RESERVACION_RECHAZADA',
      `Reservación ${selectedRes.folio} ${nuevoEstado}${nota ? ` — ${nota}` : ''}`,
      { folio: selectedRes.folio },
    );
    setModalVisible(false);
  };

  // Máximo ingreso para escalar barras
  const maxIngreso = Math.max(...tendencia.map(t => t.ingresos), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Buenos días, {state.user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.subtitle}>Resumen del día · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {getIniciales(state.user?.name ?? 'CM')}
            </Text>
          </View>
        </View>

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

        {/* ── Reservaciones recientes ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Reservaciones Recientes</Text>
            <View style={styles.searchMini}>
              <Ionicons name="search" size={14} color={Colors.textMuted} />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar..."
                placeholderTextColor={Colors.textMuted}
                style={styles.searchInput}
              />
            </View>
          </View>

          {filtradas.map(res => (
            <ReservacionRow
              key={res.id}
              res={res}
              onAceptar={() => abrirAccion(res, 'aceptar')}
              onRechazar={() => abrirAccion(res, 'rechazar')}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Modal aceptar/rechazar ── */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={accion === 'aceptar' ? '✅ Aceptar Reservación' : '❌ Rechazar Reservación'}
        size="md"
      >
        {selectedRes && (
          <View style={styles.modalBody}>
            <View style={styles.modalInfo}>
              <Text style={styles.modalFolio}>{selectedRes.folio}</Text>
              <Text style={styles.modalCliente}>{selectedRes.clienteNombre}</Text>
              <Text style={styles.modalDetalle}>
                {formatFecha(selectedRes.fechaPaseo)} · {selectedRes.horaPaseo} · {selectedRes.numPersonas} personas
              </Text>
              <Text style={styles.modalTotal}>{formatMXN(selectedRes.total)}</Text>
            </View>

            <View style={styles.notaWrap}>
              <Text style={styles.notaLabel}>Nota (opcional):</Text>
              <TextInput
                value={nota}
                onChangeText={setNota}
                placeholder={accion === 'rechazar' ? 'Motivo del rechazo...' : 'Comentarios...'}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                style={styles.notaInput}
              />
            </View>

            <View style={styles.modalBtns}>
              <Button variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button
                variant={accion === 'aceptar' ? 'secondary' : 'danger'}
                onPress={confirmarAccion}
                style={{ flex: 1 }}
              >
                {accion === 'aceptar' ? 'Aceptar' : 'Rechazar'}
              </Button>
            </View>
          </View>
        )}
      </Modal>
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

// ── ReservacionRow ─────────────────────────────────────────────────────────────

function ReservacionRow({
  res,
  onAceptar,
  onRechazar,
}: {
  res: Reservacion;
  onAceptar: () => void;
  onRechazar: () => void;
}) {
  return (
    <Card style={styles.resCard}>
      <View style={styles.resTop}>
        <View style={styles.resAvatar}>
          <Text style={styles.resAvatarText}>{getIniciales(res.clienteNombre)}</Text>
        </View>
        <View style={styles.resInfo}>
          <Text style={styles.resFolio}>{res.folio}</Text>
          <Text style={styles.resNombre}>{res.clienteNombre}</Text>
          <Text style={styles.resDetalle}>
            {formatFecha(res.fechaPaseo)} · {res.horaPaseo} · {nombrePaquete(res.paquete)} · {res.numPersonas} pers.
          </Text>
        </View>
        <View style={styles.resRight}>
          <Text style={styles.resTotal}>{formatMXN(res.total)}</Text>
          <Badge estado={res.estado} size="sm" />
        </View>
      </View>

      {/* Botones solo si está pendiente */}
      {res.estado === 'pendiente' && (
        <View style={styles.resActions}>
          <TouchableOpacity onPress={onRechazar} style={[styles.actionBtn, styles.rejectBtn]}>
            <Ionicons name="close" size={14} color={Colors.danger} />
            <Text style={[styles.actionText, { color: Colors.danger }]}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAceptar} style={[styles.actionBtn, styles.acceptBtn]}>
            <Ionicons name="checkmark" size={14} color={Colors.secondary[600]} />
            <Text style={[styles.actionText, { color: Colors.secondary[600] }]}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      )}
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

  // Reservación row
  resCard: { marginBottom: Spacing[2], gap: Spacing[2] },
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

  resActions: { flexDirection: 'row', gap: Spacing[2], paddingTop: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.border },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8, borderRadius: BorderRadius.md,
  },
  rejectBtn: { backgroundColor: Colors.estadoRechazadoLight },
  acceptBtn: { backgroundColor: Colors.estadoPagadoLight },
  actionText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  // Modal
  modalBody: { gap: Spacing[4] },
  modalInfo: { backgroundColor: Colors.neutral[50], borderRadius: BorderRadius.md, padding: Spacing[3], gap: 4 },
  modalFolio: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  modalCliente: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalDetalle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  modalTotal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary[500], marginTop: 4 },

  notaWrap: { gap: 6 },
  notaLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  notaInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    padding: Spacing[3], fontSize: FontSize.base, color: Colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top',
  },
  modalBtns: { flexDirection: 'row', gap: Spacing[3] },
});
