/**
 * Pagos Admin — Re-exporta la misma pantalla de pagos.
 * Los imports se ajustan a la ruta correcta del grupo (admin).
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '@/src/core/store/AppContext';
import { Reservacion } from '@/src/core/types/reservacion.types';
import { Pago, MetodoPago, TipoCuenta } from '@/src/core/types/pago.types';
import {
  formatMXN, formatFecha, getIniciales, nombrePaquete,
  generarFolioPago, generateId, formatTarjeta, formatFechaHora,
} from '@/src/core/utils/formatters';
import { SearchBar } from '@/src/shared/components/ui/SearchBar';
import { Card } from '@/src/shared/components/ui/Card';
import { Badge } from '@/src/shared/components/ui/Badge';
import { Button } from '@/src/shared/components/ui/Button';
import { Modal } from '@/src/shared/components/ui/Modal';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

type Vista = 'pendientes' | 'historial';
const TIPOS_CUENTA: TipoCuenta[] = ['debito', 'credito', 'visa', 'mastercard', 'amex'];
const LABEL_CUENTA: Record<TipoCuenta, string> = {
  debito: 'Débito', credito: 'Crédito', visa: 'Visa',
  mastercard: 'Mastercard', amex: 'American Express',
};

export default function PagosAdminScreen() {
  const { state, dispatch, registrarBitacora } = useAppStore();

  const [vista, setVista]         = useState<Vista>('pendientes');
  const [busqueda, setBusqueda]   = useState('');
  const [modalVisible, setModal]  = useState(false);
  const [selectedRes, setSelected]= useState<Reservacion | null>(null);
  const [metodo, setMetodo]       = useState<MetodoPago>('efectivo');
  const [tarjeta, setTarjeta]     = useState('');
  const [tipoCuenta, setTC]       = useState<TipoCuenta>('debito');
  const [expiracion, setExp]      = useState('');
  const [cvv, setCvv]             = useState('');
  const [procesando, setProc]     = useState(false);
  const [pagoExitoso, setExito]   = useState<Pago | null>(null);

  const pendientes = useMemo(() => {
    const q = busqueda.toLowerCase();
    return state.reservaciones
      .filter(r => r.estado !== 'pagado' && r.estado !== 'rechazada')
      .filter(r => !q || r.folio.toLowerCase().includes(q) || r.clienteNombre.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.reservaciones, busqueda]);

  const historial = useMemo(() => {
    const q = busqueda.toLowerCase();
    return state.pagos
      .filter(p => {
        const res = state.reservaciones.find(r => r.id === p.reservacionId);
        return !q || res?.folio.toLowerCase().includes(q) || res?.clienteNombre.toLowerCase().includes(q);
      })
      .sort((a, b) => b.procesadoAt.localeCompare(a.procesadoAt));
  }, [state.pagos, state.reservaciones, busqueda]);

  const abrirPago = (res: Reservacion) => {
    setSelected(res);
    setMetodo('efectivo');
    setTarjeta(''); setTC('debito'); setExp(''); setCvv('');
    setExito(null);
    setModal(true);
  };

  const procesarPago = async () => {
    if (!selectedRes) return;
    if (metodo === 'tarjeta') {
      const digits = tarjeta.replace(/\s/g, '');
      if (digits.length < 16) { Alert.alert('Número de tarjeta inválido', 'Ingresa los 16 dígitos.'); return; }
      if (expiracion.replace(/\D/g, '').length < 4) { Alert.alert('Fecha inválida', 'Formato MM/AA'); return; }
      if (cvv.length < 3) { Alert.alert('CVV inválido', 'Mínimo 3 dígitos.'); return; }
    }
    setProc(true);
    await new Promise(r => setTimeout(r, 2000));

    const folioPago = generarFolioPago(state.pagos.length);
    const nuevoPago: Pago = {
      id: generateId(),
      folioPago,
      reservacionId: selectedRes.id,
      metodoPago: metodo,
      monto: selectedRes.total,
      ultimos4: metodo === 'tarjeta' ? tarjeta.replace(/\s/g, '').slice(-4) : undefined,
      tipoCuenta: metodo === 'tarjeta' ? tipoCuenta : undefined,
      procesadoPor: state.user?.id ?? 'admin',
      procesadoAt: new Date().toISOString(),
    };
    const resActualizada: Reservacion = { ...selectedRes, estado: 'pagado', updatedAt: new Date().toISOString() };

    dispatch({ type: 'ADD_PAGO', payload: nuevoPago });
    dispatch({ type: 'UPDATE_RESERVACION', payload: resActualizada });
    registrarBitacora('PAGO_PROCESADO', `Pago ${folioPago} — ${formatMXN(selectedRes.total)} (${metodo})`, { folio: folioPago });
    setProc(false);
    setExito(nuevoPago);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pagos</Text>
        <View style={styles.toggle}>
          {(['pendientes', 'historial'] as Vista[]).map(v => (
            <TouchableOpacity key={v} onPress={() => setVista(v)} style={[styles.toggleBtn, vista === v && styles.toggleActive]}>
              <Text style={[styles.toggleText, vista === v && styles.toggleTextActive]}>
                {v === 'pendientes' ? 'Pendientes' : 'Historial'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={busqueda} onChangeText={setBusqueda} placeholder="Buscar folio o cliente..." />
      </View>

      <FlatList
        data={(vista === 'pendientes' ? pendientes : historial) as any[]}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name={vista === 'pendientes' ? 'checkmark-circle' : 'receipt'} size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>
              {vista === 'pendientes' ? 'Sin pagos pendientes 🎉' : 'Sin historial de pagos'}
            </Text>
          </View>
        }
        renderItem={({ item }) =>
          vista === 'pendientes'
            ? <PendienteCard res={item} onPagar={() => abrirPago(item)} />
            : <HistorialCard pago={item} reservaciones={state.reservaciones} />
        }
      />

      <Modal visible={modalVisible} onClose={() => !procesando && setModal(false)}
        title={pagoExitoso ? '✅ Pago Exitoso' : '💳 Procesar Pago'} size="md" scrollable>
        {selectedRes && (
          <View style={styles.modalContent}>
            {!pagoExitoso ? (
              <>
                <Card style={styles.resCard}>
                  <Text style={styles.resFolio}>{selectedRes.folio}</Text>
                  <Text style={styles.resNombre}>{selectedRes.clienteNombre}</Text>
                  <Text style={styles.resDetalle}>{nombrePaquete(selectedRes.paquete)} · {selectedRes.numPersonas} pers. · {formatFecha(selectedRes.fechaPaseo)}</Text>
                  {selectedRes.descuento > 0 && <Text style={styles.resDescuento}>Descuento: -{formatMXN(selectedRes.descuento)}</Text>}
                  <Text style={styles.resTotal}>{formatMXN(selectedRes.total)}</Text>
                </Card>

                <View style={styles.metodoRow}>
                  {(['efectivo', 'tarjeta'] as MetodoPago[]).map(m => (
                    <TouchableOpacity key={m} onPress={() => setMetodo(m)}
                      style={[styles.metodoBtn, metodo === m && styles.metodoBtnActive]}>
                      <Ionicons name={m === 'efectivo' ? 'cash' : 'card'} size={20}
                        color={metodo === m ? Colors.white : Colors.textMuted} />
                      <Text style={[styles.metodoText, metodo === m && styles.metodoTextActive]}>
                        {m === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {metodo === 'tarjeta' && (
                  <View style={styles.tarjetaFields}>
                    <View>
                      <Text style={styles.fieldLabel}>Número de tarjeta</Text>
                      <TextInput value={formatTarjeta(tarjeta)} onChangeText={t => setTarjeta(t.replace(/\s/g,'').slice(0,16))}
                        keyboardType="numeric" placeholder="1234 5678 9012 3456" placeholderTextColor={Colors.textMuted}
                        style={styles.tarjetaInput} maxLength={19} />
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {TIPOS_CUENTA.map(t => (
                          <TouchableOpacity key={t} onPress={() => setTC(t)}
                            style={[styles.cuentaChip, tipoCuenta === t && styles.cuentaChipActive]}>
                            <Text style={[styles.cuentaText, tipoCuenta === t && { color: Colors.white }]}>{LABEL_CUENTA[t]}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>Expiración</Text>
                        <TextInput value={expiracion} onChangeText={t => setExp(t.slice(0,5))} placeholder="MM/AA"
                          keyboardType="numeric" placeholderTextColor={Colors.textMuted} style={styles.tarjetaInput} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>CVV</Text>
                        <TextInput value={cvv} onChangeText={t => setCvv(t.slice(0,4))} placeholder="•••"
                          keyboardType="numeric" secureTextEntry placeholderTextColor={Colors.textMuted} style={styles.tarjetaInput} />
                      </View>
                    </View>
                  </View>
                )}

                <Button onPress={procesarPago} loading={procesando} fullWidth size="lg" variant="secondary">
                  {procesando ? 'Procesando...' : `Confirmar ${formatMXN(selectedRes.total)}`}
                </Button>
              </>
            ) : (
              <View style={styles.exitoWrap}>
                <View style={styles.exitoIcon}><Ionicons name="checkmark" size={48} color={Colors.white} /></View>
                <Text style={styles.exitoTitle}>¡Pago registrado!</Text>
                <Text style={styles.exitoFolio}>{pagoExitoso.folioPago}</Text>
                <Button onPress={() => setModal(false)} fullWidth variant="secondary">Cerrar</Button>
              </View>
            )}
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function PendienteCard({ res, onPagar }: { res: Reservacion; onPagar: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{getIniciales(res.clienteNombre)}</Text></View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardFolio}>{res.folio}</Text>
          <Text style={styles.cardNombre}>{res.clienteNombre}</Text>
          <Text style={styles.cardDetalle}>{formatFecha(res.fechaPaseo)} · {nombrePaquete(res.paquete)}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardTotal}>{formatMXN(res.total)}</Text>
          <Badge estado={res.estado} size="sm" />
        </View>
      </View>
      <TouchableOpacity style={styles.pagarBtn} onPress={onPagar} activeOpacity={0.85}>
        <Ionicons name="card" size={16} color={Colors.white} />
        <Text style={styles.pagarText}>Procesar Pago</Text>
      </TouchableOpacity>
    </Card>
  );
}

function HistorialCard({ pago, reservaciones }: { pago: Pago; reservaciones: Reservacion[] }) {
  const res = reservaciones.find(r => r.id === pago.reservacionId);
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: Colors.estadoPagadoLight }]}>
          <Ionicons name={pago.metodoPago === 'tarjeta' ? 'card' : 'cash'} size={20} color={Colors.estadoPagado} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardFolio}>{pago.folioPago}</Text>
          <Text style={styles.cardNombre}>{res?.clienteNombre ?? 'Cliente'}</Text>
          <Text style={styles.cardDetalle}>{formatFechaHora(pago.procesadoAt)}</Text>
        </View>
        <Text style={styles.cardTotal}>{formatMXN(pago.monto)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing[4], backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing[3] },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  toggle: { flexDirection: 'row', backgroundColor: Colors.neutral[100], borderRadius: BorderRadius.md, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.sm },
  toggleActive: { backgroundColor: Colors.white, elevation: 2 },
  toggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textMuted },
  toggleTextActive: { color: Colors.primary[500], fontWeight: FontWeight.bold },
  searchWrap: { padding: Spacing[3], backgroundColor: Colors.white },
  list: { padding: Spacing[4], gap: Spacing[2], paddingBottom: 80 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing[3] },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  card: { gap: Spacing[3] },
  cardTop: { flexDirection: 'row', gap: Spacing[3] },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary[100], justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  cardInfo: { flex: 1, gap: 2 },
  cardFolio: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  cardNombre: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  cardDetalle: { fontSize: FontSize.xs, color: Colors.textSecondary },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardTotal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  pagarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.secondary[500], borderRadius: BorderRadius.md, paddingVertical: Spacing[3] },
  pagarText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.base },
  modalContent: { gap: Spacing[4] },
  resCard: { gap: Spacing[2] },
  resFolio: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  resNombre: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  resDetalle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  resDescuento: { fontSize: FontSize.sm, color: Colors.success },
  resTotal: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.primary[500], marginTop: 4 },
  metodoRow: { flexDirection: 'row', gap: Spacing[3] },
  metodoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing[3], borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white },
  metodoBtnActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  metodoText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  metodoTextActive: { color: Colors.white },
  tarjetaFields: { gap: Spacing[3] },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 6 },
  tarjetaInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, padding: Spacing[3], fontSize: FontSize.base, color: Colors.textPrimary },
  cuentaChip: { paddingHorizontal: Spacing[3], paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.neutral[50] },
  cuentaChipActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  cuentaText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  exitoWrap: { alignItems: 'center', gap: Spacing[4] },
  exitoIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center' },
  exitoTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  exitoFolio: { fontSize: FontSize.base, color: Colors.textMuted, fontFamily: 'monospace' },
});
