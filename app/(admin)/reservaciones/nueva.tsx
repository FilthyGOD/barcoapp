/**
 * Nueva Reservación — Premium UI using dashboard color palette.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  useWindowDimensions,
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
import { formatMXN } from '@/src/core/utils/formatters';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

const HORARIOS: HorarioPaseo[] = ['10:00', '14:00', '17:30'];
const HORARIO_ICONS: Record<HorarioPaseo, keyof typeof Ionicons.glyphMap> = {
  '10:00': 'sunny-outline',
  '14:00': 'partly-sunny-outline',
  '17:30': 'moon-outline',
};
const HORARIO_LABELS: Record<HorarioPaseo, string> = {
  '10:00': 'Mañana',
  '14:00': 'Tarde',
  '17:30': 'Atardecer',
};

const PAQUETES: Array<{ key: PaqueteTipo; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }> = [
  { key: 'comida',  icon: 'fast-food-outline',  label: 'Con Comida',    desc: 'Incluye alimentos y bebidas' },
  { key: 'bebidas', icon: 'wine-outline',        label: 'Solo Bebidas',  desc: 'Barra libre premium' },
  { key: 'paseo',   icon: 'water-outline',       label: 'Solo Paseo',    desc: 'Paseo básico en alta mar' },
];

export default function NuevaReservacion() {
  const { state, dispatch, registrarBitacora } = useAppStore();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 900;

  const hoy = new Date().toISOString().split('T')[0];

  const [fecha, setFecha]             = useState(hoy);
  const [hora, setHora]               = useState<HorarioPaseo>('17:30');
  const [personas, setPersonas]       = useState(4);
  const [servicio, setServicio]       = useState<ServicioTipo>('individual');
  const [paquete, setPaquete]         = useState<PaqueteTipo>('comida');
  const [nombre, setNombre]           = useState('');
  const [telefono, setTelefono]       = useState('');
  const [loading, setLoading]         = useState(false);

  const totales = calcularTotales(personas, paquete, state.config);
  const aplicaDescuento = personas >= state.config.minPersonasDescuento;
  const precioPaquete = state.config.precios[paquete];

  const validate = () => {
    if (!fecha) { Alert.alert('Error', 'Selecciona la fecha del paseo'); return false; }
    if (!nombre.trim()) { Alert.alert('Error', 'Ingresa el nombre completo'); return false; }
    if (telefono.replace(/\D/g, '').length < 10) { Alert.alert('Error', 'Teléfono incompleto (10 dígitos)'); return false; }
    return true;
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

    const nueva = crearReservacion(formData, state.config, state.user?.id || 'guest', state.reservaciones.length);
    dispatch({ type: 'ADD_RESERVACION', payload: nueva });
    registrarBitacora(
      'RESERVACION_CREADA',
      `Reservación ${nueva.folio} creada para ${nueva.clienteNombre}`,
      { folio: nueva.folio, total: nueva.total },
    );

    setLoading(false);

    if (Platform.OS === 'web') {
      window.alert(`✅ Reservación creada\n\n${nueva.folio} registrada para ${nueva.clienteNombre}.\nTotal: ${formatMXN(nueva.total)}`);
      router.back();
    } else {
      Alert.alert(
        '✅ Reservación creada',
        `${nueva.folio} registrada para ${nueva.clienteNombre}.\nTotal: ${formatMXN(nueva.total)}`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva Reservación</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          <View style={[styles.contentLayout, isLargeScreen && styles.contentLayoutLarge]}>
            {/* ── Left Column (Forms) ── */}
            <View style={styles.formColumn}>

              {/* ── 1. Fecha del Paseo ── */}
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Ionicons name="calendar" size={18} color={Colors.primary[500]} />
                  <Text style={styles.panelTitle}>Fecha del Paseo</Text>
                </View>

                <Text style={styles.label}>FECHA</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={fecha}
                    onChangeText={setFecha}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <Text style={styles.hint}>Formato: 2025-12-25</Text>

                <Text style={[styles.label, { marginTop: Spacing[4] }]}>HORARIO</Text>
                <View style={styles.timeRow}>
                  {HORARIOS.map(h => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setHora(h)}
                      style={[styles.timeBtn, hora === h && styles.timeBtnActive]}
                    >
                      <Ionicons
                        name={HORARIO_ICONS[h]}
                        size={18}
                        color={hora === h ? Colors.white : Colors.primary[400]}
                      />
                      <Text style={[styles.timeText, hora === h && styles.timeTextActive]}>
                        {HORARIO_LABELS[h]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── 2. Pasajeros ── */}
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Ionicons name="people" size={18} color={Colors.primary[500]} />
                  <Text style={styles.panelTitle}>Pasajeros</Text>
                </View>

                <Text style={styles.label}>NÚMERO DE PERSONAS</Text>
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


              </View>

              {/* ── 3. Selección de Paquete ── */}
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Ionicons name="restaurant" size={18} color={Colors.primary[500]} />
                  <Text style={styles.panelTitle}>Selección de Paquete</Text>
                </View>

                {PAQUETES.map(p => (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => setPaquete(p.key)}
                    activeOpacity={0.8}
                    style={[styles.paqueteCard, paquete === p.key && styles.paqueteCardActive]}
                  >
                    <View style={[
                      styles.paqueteIconWrap,
                      { backgroundColor: paquete === p.key ? Colors.secondary[100] : Colors.neutral[100] },
                    ]}>
                      <Ionicons
                        name={p.icon}
                        size={22}
                        color={paquete === p.key ? Colors.secondary[500] : Colors.textMuted}
                      />
                    </View>
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
              </View>

              {/* ── 4. Datos del Cliente ── */}
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Ionicons name="person" size={18} color={Colors.primary[500]} />
                  <Text style={styles.panelTitle}>Datos del Cliente</Text>
                </View>

                <Text style={styles.label}>NOMBRE COMPLETO</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Ej: Roberto Morales Gastélum"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                <Text style={[styles.label, { marginTop: Spacing[4] }]}>TELÉFONO</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="call-outline" size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={telefono}
                    onChangeText={t => {
                      const digits = t.replace(/\D/g, '').slice(0, 10);
                      setTelefono(digits);
                    }}
                    placeholder="6381234567"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.hint}>10 dígitos sin espacios ni guiones</Text>
              </View>

            </View>

            {/* ── Right Column / Bottom (Resumen) ── */}
            <View style={[styles.summaryWrap, isLargeScreen && { width: 360 }]}>
              <View style={styles.summaryPanel}>
                <Text style={styles.summaryTitle}>Resumen de Costos</Text>

                <View style={styles.summaryItems}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>{formatMXN(totales.subtotal)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Pasajeros (x{personas})</Text>
                    <Text style={styles.summaryValue}>{formatMXN(0)}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Impuesto Marítimo ⓘ</Text>
                    <Text style={styles.summaryValue}>{formatMXN(totales.impuesto)}</Text>
                  </View>

                  {aplicaDescuento && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: Colors.success }]}>
                        Desc. grupal ({state.config.porcentajeDescuento}%)
                      </Text>
                      <Text style={[styles.summaryValue, { color: Colors.success }]}>
                        -{formatMXN(totales.descuento)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <View style={styles.totalPriceWrap}>
                    <Text style={styles.totalPrice}>
                      {formatMXN(totales.total)}
                    </Text>
                    <Text style={styles.totalCurrency}>MXN</Text>
                  </View>
                </View>

                {aplicaDescuento && (
                  <View style={styles.discountBadge}>
                    <Ionicons name="pricetag" size={12} color={Colors.success} />
                    <Text style={styles.discountText}>
                      ¡Ahorras {formatMXN(totales.descuento)} con descuento grupal!
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  onPress={handleGuardar}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send" size={18} color={Colors.white} />
                  <Text style={styles.submitBtnText}>
                    {loading ? 'Procesando...' : 'Enviar Solicitud'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                  Al enviar, aceptas los términos y condiciones del servicio.
                </Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 80 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.primary[500],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // Content Layout
  contentLayout: {
    padding: Spacing[4],
    gap: Spacing[4],
  },
  contentLayoutLarge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formColumn: {
    flex: 1,
    gap: Spacing[4],
  },

  // Panel (Card)
  panel: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  panelTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  // Labels & Inputs
  label: {
    fontSize: 10,
    fontWeight: '800' as any,
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: Spacing[2],
    textTransform: 'uppercase',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.neutral[50],
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    height: 48,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.secondary[500],
    marginTop: 4,
  },

  // Time Row
  timeRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  timeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.neutral[50],
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
  },
  timeBtnActive: {
    borderColor: Colors.secondary[500],
    backgroundColor: Colors.secondary[500],
  },
  timeText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  timeTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stepBtn: {
    padding: Spacing[4],
    alignItems: 'center',
  },
  stepValue: {
    flex: 1,
    alignItems: 'center',
  },
  stepNum: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.primary[500],
  },
  stepUnit: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },



  // Paquete Cards
  paqueteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.neutral[50],
    marginBottom: Spacing[3],
  },
  paqueteCardActive: {
    borderColor: Colors.secondary[500],
    backgroundColor: Colors.secondary[50],
  },
  paqueteIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paqueteInfo: { flex: 1 },
  paqueteLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  paqueteLabelActive: {
    color: Colors.secondary[600],
  },
  paqueteDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  paquetePrecioWrap: { alignItems: 'flex-end' },
  paquetePrecio: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.textSecondary,
  },
  paquetePrecioActive: {
    color: Colors.secondary[600],
  },
  paquetePerPers: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // Summary Panel
  summaryWrap: {
    width: '100%',
  },
  summaryPanel: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[4],
  },
  summaryItems: {
    gap: Spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing[4],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  totalLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  totalPriceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalPrice: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.primary[500],
  },
  totalCurrency: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.md,
    padding: Spacing[2],
    marginBottom: Spacing[4],
  },
  discountText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.medium,
    flex: 1,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[4],
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  submitBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
