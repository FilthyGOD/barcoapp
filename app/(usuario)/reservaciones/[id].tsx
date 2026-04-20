/**
 * Editar Reservación — carga datos existentes y permite modificarlos.
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
import { useRouter, useLocalSearchParams } from 'expo-router';

import { useAppStore } from '@/src/core/store/AppContext';
import {
  PaqueteTipo,
  ServicioTipo,
  HorarioPaseo,
  ReservacionFormData,
} from '@/src/core/types/reservacion.types';
import {
  calcularTotales,
  actualizarReservacion,
} from '@/src/core/services/reservaciones.service';
import { formatMXN } from '@/src/core/utils/formatters';
import { Input } from '@/src/shared/components/ui/Input';
import { Button } from '@/src/shared/components/ui/Button';
import { Card } from '@/src/shared/components/ui/Card';
import { Badge } from '@/src/shared/components/ui/Badge';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

const HORARIOS: HorarioPaseo[] = ['10:00', '14:00', '17:30'];
const PAQUETES: Array<{ key: PaqueteTipo; icon: string; label: string }> = [
  { key: 'comida',  icon: '🍽',  label: 'Con Comida'   },
  { key: 'bebidas', icon: '🥤',  label: 'Solo Bebidas' },
  { key: 'paseo',   icon: '⚓',  label: 'Solo Paseo'   },
];

export default function EditarReservacion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch, registrarBitacora } = useAppStore();
  const router = useRouter();

  const reservacion = state.reservaciones.find(r => r.id === id);

  const [fecha, setFecha]       = useState(reservacion?.fechaPaseo ?? '');
  const [hora, setHora]         = useState<HorarioPaseo>(reservacion?.horaPaseo ?? '17:30');
  const [personas, setPersonas] = useState(reservacion?.numPersonas ?? 2);
  const [servicio, setServicio] = useState<ServicioTipo>(reservacion?.tipoServicio ?? 'individual');
  const [paquete, setPaquete]   = useState<PaqueteTipo>(reservacion?.paquete ?? 'comida');
  const [nombre, setNombre]     = useState(reservacion?.clienteNombre ?? '');
  const [telefono, setTelefono] = useState(reservacion?.clienteTelefono ?? '');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  if (!reservacion) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Reservación no encontrada</Text>
        <Button onPress={() => router.back()} variant="outline">Regresar</Button>
      </View>
    );
  }

  const totales = calcularTotales(personas, paquete, state.config);
  const aplicaDescuento = personas >= state.config.minPersonasDescuento;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fecha) errs.fecha = 'Selecciona la fecha del paseo';
    if (!nombre.trim()) errs.nombre = 'Ingresa el nombre del cliente';
    if (telefono.replace(/\D/g, '').length < 10) errs.telefono = 'Teléfono incompleto';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));

    const formData: ReservacionFormData = {
      fechaPaseo: fecha,
      horaPaseo: hora,
      numPersonas: personas,
      tipoServicio: servicio,
      paquete,
      clienteNombre: nombre.trim(),
      clienteTelefono: telefono.replace(/\D/g, ''),
    };

    const actualizada = actualizarReservacion(reservacion, formData, state.config);
    dispatch({ type: 'UPDATE_RESERVACION', payload: actualizada });
    registrarBitacora(
      'RESERVACION_EDITADA',
      `Reservación ${reservacion.folio} editada`,
      { folio: reservacion.folio },
    );
    setLoading(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary[500]} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Editar Reservación</Text>
            <Text style={styles.folio}>{reservacion.folio}</Text>
          </View>
          <Badge estado={reservacion.estado} size="sm" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>

            {/* Fecha */}
            <Input label="Fecha del paseo" value={fecha}
              onChangeText={t => { setFecha(t); setErrors(e => ({ ...e, fecha: undefined })); }}
              placeholder="YYYY-MM-DD" leftIcon="calendar" error={errors.fecha} />

            {/* Horario */}
            <View>
              <Text style={styles.fieldLabel}>Horario</Text>
              <View style={styles.optRow}>
                {HORARIOS.map(h => (
                  <TouchableOpacity key={h} onPress={() => setHora(h)}
                    style={[styles.optBtn, hora === h && styles.optBtnActive]}>
                    <Text style={[styles.optText, hora === h && styles.optTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Personas */}
            <View>
              <Text style={styles.fieldLabel}>Personas</Text>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => setPersonas(p => Math.max(1, p - 1))} style={styles.stepBtn}>
                  <Ionicons name="remove" size={20} color={Colors.primary[500]} />
                </TouchableOpacity>
                <Text style={styles.stepNum}>{personas}</Text>
                <TouchableOpacity onPress={() => setPersonas(p => Math.min(50, p + 1))} style={styles.stepBtn}>
                  <Ionicons name="add" size={20} color={Colors.primary[500]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tipo de servicio */}
            <View>
              <Text style={styles.fieldLabel}>Tipo de servicio</Text>
              <View style={styles.toggleRow}>
                {(['individual', 'grupal'] as ServicioTipo[]).map(s => (
                  <TouchableOpacity key={s} onPress={() => setServicio(s)}
                    style={[styles.toggleBtn, servicio === s && styles.toggleBtnActive]}>
                    <Text style={[styles.toggleText, servicio === s && styles.toggleTextActive]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Paquete */}
            <View>
              <Text style={styles.fieldLabel}>Paquete</Text>
              {PAQUETES.map(p => (
                <TouchableOpacity key={p.key} onPress={() => setPaquete(p.key)} activeOpacity={0.8}
                  style={[styles.paqueteCard, paquete === p.key && styles.paqueteCardActive]}>
                  <Text style={{ fontSize: 22 }}>{p.icon}</Text>
                  <Text style={[styles.paqueteLabel, paquete === p.key && { color: Colors.secondary[600] }]}>
                    {p.label}
                  </Text>
                  <Text style={[styles.paquetePrecio, paquete === p.key && { color: Colors.secondary[600] }]}>
                    {formatMXN(state.config.precios[p.key])} / pers.
                  </Text>
                  {paquete === p.key && <Ionicons name="checkmark-circle" size={20} color={Colors.secondary[500]} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Datos del cliente */}
            <Input label="Nombre del cliente" value={nombre}
              onChangeText={t => { setNombre(t); setErrors(e => ({ ...e, nombre: undefined })); }}
              leftIcon="person" error={errors.nombre} />
            <Input label="Teléfono" value={telefono}
              onChangeText={t => { setTelefono(t.replace(/\D/g, '').slice(0, 10)); setErrors(e => ({ ...e, telefono: undefined })); }}
              keyboardType="phone-pad" leftIcon="call" error={errors.telefono} />

            {/* Resumen */}
            <Card style={styles.resumen}>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Subtotal</Text>
                <Text style={styles.resumenVal}>{formatMXN(totales.subtotal)}</Text>
              </View>
              {aplicaDescuento && (
                <View style={styles.resumenRow}>
                  <Text style={styles.resumenLabel}>Descuento {state.config.porcentajeDescuento}%</Text>
                  <Text style={[styles.resumenVal, { color: Colors.success }]}>-{formatMXN(totales.descuento)}</Text>
                </View>
              )}
              <View style={[styles.resumenRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalVal}>{formatMXN(totales.total)}</Text>
              </View>
            </Card>

            <Button onPress={handleGuardar} loading={loading} fullWidth size="lg">
              Guardar Cambios
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  notFoundText: { fontSize: FontSize.xl, color: Colors.textSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[4], backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  folio: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },

  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: 40 },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing[2] },

  optRow: { flexDirection: 'row', gap: Spacing[2] },
  optBtn: {
    flex: 1, paddingVertical: Spacing[3], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center',
  },
  optBtnActive: { borderColor: Colors.secondary[500], backgroundColor: Colors.secondary[50] },
  optText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  optTextActive: { color: Colors.secondary[600], fontWeight: FontWeight.bold },

  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  stepBtn: { padding: Spacing[4] },
  stepNum: { flex: 1, textAlign: 'center', fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.primary[500] },

  toggleRow: { flexDirection: 'row', gap: Spacing[2] },
  toggleBtn: {
    flex: 1, paddingVertical: Spacing[3], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  toggleText: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  toggleTextActive: { color: Colors.white, fontWeight: FontWeight.bold },

  paqueteCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[3], borderRadius: BorderRadius.lg,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, marginBottom: Spacing[2],
  },
  paqueteCardActive: { borderColor: Colors.secondary[500], backgroundColor: Colors.secondary[50] },
  paqueteLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  paquetePrecio: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },

  resumen: { gap: Spacing[3] },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resumenLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  resumenVal: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing[3] },
  totalLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  totalVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary[500] },
});
