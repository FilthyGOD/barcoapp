/**
 * Nueva Reservación — Formulario completo con cálculo automático de totales.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppStore } from '@/src/core/store/AppContext';
import {
  PaqueteTipo,
  ServicioTipo,
  HorarioPaseo,
  ReservacionFormData,
} from '@/src/core/types/reservacion.types';
import {
  calcularTotales,
  crearReservacion,
} from '@/src/core/services/reservaciones.service';
import { formatMXN, formatTelefono } from '@/src/core/utils/formatters';
import { Input } from '@/src/shared/components/ui/Input';
import { Button } from '@/src/shared/components/ui/Button';
import { Card } from '@/src/shared/components/ui/Card';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

const HORARIOS: HorarioPaseo[] = ['10:00', '14:00', '17:30'];
const HORARIO_LABEL: Record<HorarioPaseo, string> = {
  '10:00': '10:00 AM — Mañana',
  '14:00': '2:00 PM — Tarde',
  '17:30': '5:30 PM — Atardecer ⭐',
};

const PAQUETES: Array<{ key: PaqueteTipo; icon: string; label: string; desc: string }> = [
  { key: 'comida',  icon: '🍽',  label: 'Con Comida',    desc: 'Incluye alimentos y bebidas' },
  { key: 'bebidas', icon: '🥤',  label: 'Solo Bebidas',  desc: 'Bebidas sin límite' },
  { key: 'paseo',   icon: '⚓',  label: 'Solo Paseo',    desc: 'Paseo básico en alta mar' },
];

export default function NuevaReservacion() {
  const { state, dispatch, registrarBitacora } = useAppStore();
  const router = useRouter();

  // Fecha de hoy como default
  const hoy = new Date().toISOString().split('T')[0];

  const [fecha, setFecha]             = useState(hoy);
  const [hora, setHora]               = useState<HorarioPaseo>('17:30');
  const [personas, setPersonas]       = useState(2);
  const [servicio, setServicio]       = useState<ServicioTipo>('individual');
  const [paquete, setPaquete]         = useState<PaqueteTipo>('comida');
  const [nombre, setNombre]           = useState('');
  const [telefono, setTelefono]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});

  // Cálculo reactivo en tiempo real
  const totales = calcularTotales(personas, paquete, state.config);
  const aplicaDescuento = personas >= state.config.minPersonasDescuento;
  const precioPaquete = state.config.precios[paquete];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fecha)              errs.fecha    = 'Selecciona la fecha del paseo';
    if (!nombre.trim())      errs.nombre   = 'Ingresa el nombre del cliente';
    if (telefono.replace(/\D/g, '').length < 10) errs.telefono = 'Teléfono incompleto (10 dígitos)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    const formData: ReservacionFormData = {
      fechaPaseo: fecha,
      horaPaseo: hora,
      numPersonas: personas,
      tipoServicio: servicio,
      paquete,
      clienteNombre: nombre.trim(),
      clienteTelefono: telefono.replace(/\D/g, ''),
    };

    const nueva = crearReservacion(formData, state.config, state.user!.id, state.reservaciones.length);
    dispatch({ type: 'ADD_RESERVACION', payload: nueva });
    registrarBitacora(
      'RESERVACION_CREADA',
      `Reservación ${nueva.folio} creada para ${nueva.clienteNombre}`,
      { folio: nueva.folio, total: nueva.total },
    );

    setLoading(false);
    Alert.alert(
      '✅ Reservación creada',
      `${nueva.folio} registrada exitosamente para ${nueva.clienteNombre}.\nTotal: ${formatMXN(nueva.total)}`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={styles.title}>Nueva Reservación</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>

            {/* ── 1. Fecha y hora ── */}
            <SectionTitle icon="calendar" title="Fecha del Paseo" />
            <Input
              label="Fecha"
              value={fecha}
              onChangeText={t => { setFecha(t); setErrors(e => ({ ...e, fecha: undefined })); }}
              placeholder="YYYY-MM-DD"
              leftIcon="calendar"
              error={errors.fecha}
              hint="Formato: 2025-12-25"
            />
            <View style={styles.rowLabel}>
              <Text style={styles.fieldLabel}>Horario</Text>
            </View>
            <View style={styles.optRow}>
              {HORARIOS.map(h => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setHora(h)}
                  style={[styles.optBtn, hora === h && styles.optBtnActive]}
                >
                  <Text style={[styles.optText, hora === h && styles.optTextActive]}>
                    {h === '10:00' ? '☀️' : h === '14:00' ? '🌤' : '🌅'} {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── 2. Personas y tipo ── */}
            <SectionTitle icon="people" title="Pasajeros" />
            <View style={styles.rowLabel}>
              <Text style={styles.fieldLabel}>Número de personas</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={() => setPersonas(p => Math.max(1, p - 1))}
                style={styles.stepBtn}
              >
                <Ionicons name="remove" size={20} color={Colors.primary[500]} />
              </TouchableOpacity>
              <View style={styles.stepValue}>
                <Text style={styles.stepNum}>{personas}</Text>
                <Text style={styles.stepUnit}>persona{personas > 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPersonas(p => Math.min(50, p + 1))}
                style={styles.stepBtn}
              >
                <Ionicons name="add" size={20} color={Colors.primary[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.rowLabel}>
              <Text style={styles.fieldLabel}>Tipo de servicio</Text>
            </View>
            <View style={styles.toggleRow}>
              {(['individual', 'grupal'] as ServicioTipo[]).map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setServicio(s)}
                  style={[styles.toggleBtn, servicio === s && styles.toggleBtnActive]}
                >
                  <Ionicons
                    name={s === 'individual' ? 'person' : 'people'}
                    size={16}
                    color={servicio === s ? Colors.white : Colors.textMuted}
                  />
                  <Text style={[styles.toggleText, servicio === s && styles.toggleTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── 3. Paquete ── */}
            <SectionTitle icon="restaurant" title="Selección de Paquete" />
            {PAQUETES.map(p => (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPaquete(p.key)}
                activeOpacity={0.8}
                style={[styles.paqueteCard, paquete === p.key && styles.paqueteCardActive]}
              >
                <Text style={styles.paqueteIcon}>{p.icon}</Text>
                <View style={styles.paqueteInfo}>
                  <Text style={[styles.paqueteLabel, paquete === p.key && styles.paqueteLabelActive]}>
                    {p.label}
                  </Text>
                  <Text style={styles.paqueteDesc}>{p.desc}</Text>
                </View>
                <View style={styles.paquetePrecioWrap}>
                  <Text style={[styles.paquetePrecio, paquete === p.key && styles.paquetePrecioActive]}>
                    {formatMXN(state.config.precios[p.key])}
                  </Text>
                  <Text style={styles.paquetePerPers}>p/persona</Text>
                </View>
                {paquete === p.key && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.secondary[500]} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            ))}

            {/* ── 4. Datos del cliente ── */}
            <SectionTitle icon="person" title="Datos del Cliente" />
            <Input
              label="Nombre completo"
              placeholder="Ej: Roberto Morales Gastélum"
              value={nombre}
              onChangeText={t => { setNombre(t); setErrors(e => ({ ...e, nombre: undefined })); }}
              leftIcon="person"
              error={errors.nombre}
            />
            <Input
              label="Teléfono"
              placeholder="6381234567"
              value={telefono}
              onChangeText={t => {
                const digits = t.replace(/\D/g, '').slice(0, 10);
                setTelefono(digits);
                setErrors(e => ({ ...e, telefono: undefined }));
              }}
              keyboardType="phone-pad"
              leftIcon="call"
              error={errors.telefono}
              hint="10 dígitos sin espacios ni guiones"
            />

            {/* ── 5. Resumen de costos ── */}
            <SectionTitle icon="calculator" title="Resumen de Costos" />
            <Card style={styles.resumenCard}>
              <ResumenRow
                label={`${formatMXN(precioPaquete)} × ${personas} persona${personas > 1 ? 's' : ''}`}
                value={formatMXN(totales.subtotal)}
              />
              {aplicaDescuento && (
                <ResumenRow
                  label={`Descuento grupal ${state.config.porcentajeDescuento}% (≥${state.config.minPersonasDescuento} pers.)`}
                  value={`-${formatMXN(totales.descuento)}`}
                  isDiscount
                />
              )}
              <View style={styles.resumenDivider} />
              <ResumenRow
                label="TOTAL"
                value={formatMXN(totales.total)}
                isBold
              />
              {aplicaDescuento && (
                <View style={styles.descuentoBadge}>
                  <Ionicons name="pricetag" size={12} color={Colors.success} />
                  <Text style={styles.descuentoText}>
                    ¡Ahorras {formatMXN(totales.descuento)} con el descuento grupal!
                  </Text>
                </View>
              )}
            </Card>

            {/* Botón guardar */}
            <Button
              onPress={handleGuardar}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.saveBtn}
            >
              💾 Guardar Reservación
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={16} color={Colors.secondary[500]} />
      </View>
      <Text style={styles.sectionText}>{title}</Text>
    </View>
  );
}

function ResumenRow({
  label, value, isDiscount, isBold,
}: {
  label: string;
  value: string;
  isDiscount?: boolean;
  isBold?: boolean;
}) {
  return (
    <View style={styles.resumenRow}>
      <Text style={[styles.resumenLabel, isBold && { fontWeight: FontWeight.bold, color: Colors.textPrimary }]}>
        {label}
      </Text>
      <Text style={[
        styles.resumenValue,
        isDiscount && { color: Colors.success },
        isBold && { fontWeight: FontWeight.extrabold, fontSize: FontSize.xl, color: Colors.primary[500] },
      ]}>
        {value}
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary[500] },

  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: 40 },

  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  sectionIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.secondary[50],
    justifyContent: 'center', alignItems: 'center',
  },
  sectionText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  rowLabel: { marginBottom: -8 },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  optRow: { flexDirection: 'row', gap: Spacing[2] },
  optBtn: {
    flex: 1, paddingVertical: Spacing[3], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white, alignItems: 'center',
  },
  optBtnActive: { borderColor: Colors.secondary[500], backgroundColor: Colors.secondary[50] },
  optText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  optTextActive: { color: Colors.secondary[600], fontWeight: FontWeight.bold },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepBtn: { padding: Spacing[4], alignItems: 'center' },
  stepValue: { flex: 1, alignItems: 'center' },
  stepNum: { fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, color: Colors.primary[500] },
  stepUnit: { fontSize: FontSize.xs, color: Colors.textMuted },

  toggleRow: { flexDirection: 'row', gap: Spacing[2] },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing[3], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  toggleBtnActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  toggleText: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  toggleTextActive: { color: Colors.white, fontWeight: FontWeight.bold },

  paqueteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  paqueteCardActive: { borderColor: Colors.secondary[500], backgroundColor: Colors.secondary[50] },
  paqueteIcon: { fontSize: 28 },
  paqueteInfo: { flex: 1 },
  paqueteLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  paqueteLabelActive: { color: Colors.secondary[600] },
  paqueteDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  paquetePrecioWrap: { alignItems: 'flex-end' },
  paquetePrecio: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textSecondary },
  paquetePrecioActive: { color: Colors.secondary[600] },
  paquetePerPers: { fontSize: FontSize.xs, color: Colors.textMuted },

  resumenCard: { gap: Spacing[3] },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumenLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  resumenValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  resumenDivider: { height: 1, backgroundColor: Colors.border },
  descuentoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.md,
    padding: Spacing[2],
  },
  descuentoText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.medium, flex: 1 },

  saveBtn: { marginTop: Spacing[4] },
});
