/**
 * Reservaciones — Lista con filtros y búsqueda.
 * Solo accesible para rol Usuario.
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
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppStore } from '@/src/core/store/AppContext';
import { Reservacion } from '@/src/core/types/reservacion.types';
import { filtrarReservaciones } from '@/src/core/services/reservaciones.service';
import { Pago } from '@/src/core/types/pago.types';
import {
  formatMXN,
  formatFecha,
  getIniciales,
  nombrePaquete,
  generarFolioPago,
  generateId,
} from '@/src/core/utils/formatters';
import { SearchBar } from '@/src/shared/components/ui/SearchBar';
import { Badge } from '@/src/shared/components/ui/Badge';
import { Card } from '@/src/shared/components/ui/Card';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

type TabType = 'pendientes' | 'aceptadas' | 'historial';

const PAGE_SIZE = 10;

export default function ReservacionesScreen() {
  const { state, dispatch, registrarBitacora, refreshData } = useAppStore();
  const router = useRouter();

  const [busqueda, setBusqueda] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('pendientes');
  const [pagina, setPagina] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const [pagoModalVisible, setPagoModalVisible] = useState(false);
  const [resParaPago, setResParaPago] = useState<Reservacion | null>(null);

  const [boletoModalVisible, setBoletoModalVisible] = useState(false);
  const [resParaBoleto, setResParaBoleto] = useState<Reservacion | null>(null);

  const filtradas = useMemo(() => {
    const basico = filtrarReservaciones(state.reservaciones, { busqueda });
    return basico.filter(r => {
      if (activeTab === 'pendientes') {
        return r.estado === 'pendiente';
      } else if (activeTab === 'aceptadas') {
        return r.estado === 'aceptada';
      } else {
        return r.estado === 'pagado' || r.estado === 'rechazada';
      }
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.reservaciones, activeTab, busqueda]);

  const paginadas = filtradas.slice(0, pagina * PAGE_SIZE);
  const hayMas = paginadas.length < filtradas.length;

  const handleDelete = (res: Reservacion) => {
    const doDelete = () => {
      dispatch({ type: 'DELETE_RESERVACION', payload: res.id });
      registrarBitacora(
        'RESERVACION_ELIMINADA',
        `Reservación ${res.folio} eliminada — ${res.clienteNombre}`,
        { folio: res.folio },
      );
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Estás segura de eliminar ${res.folio} — ${res.clienteNombre}?\nEsta acción no se puede deshacer.`)) {
        doDelete();
      }
      return;
    }

    Alert.alert(
      'Eliminar reservación',
      `¿Estás segura de eliminar ${res.folio} — ${res.clienteNombre}?\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: doDelete },
      ],
    );
  };

  const handleAceptar = (res: Reservacion) => {
    const doAceptar = () => {
      dispatch({ type: 'UPDATE_RESERVACION', payload: { ...res, estado: 'aceptada' } });
      registrarBitacora('RESERVACION_ACEPTADA', `Reservación ${res.folio} aceptada`, { folio: res.folio });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Confirmas aceptar la reservación de ${res.clienteNombre}?`)) {
        doAceptar();
      }
      return;
    }

    Alert.alert(
      'Aceptar reservación',
      `¿Confirmas aceptar la reservación de ${res.clienteNombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceptar', style: 'default', onPress: doAceptar },
      ],
    );
  };

  const handleRechazar = (res: Reservacion) => {
    const doRechazar = () => {
      dispatch({ type: 'UPDATE_RESERVACION', payload: { ...res, estado: 'rechazada' } });
      registrarBitacora('RESERVACION_RECHAZADA', `Reservación ${res.folio} rechazada`, { folio: res.folio });
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Confirmas rechazar la reservación de ${res.clienteNombre}?`)) {
        doRechazar();
      }
      return;
    }

    Alert.alert(
      'Rechazar reservación',
      `¿Confirmas rechazar la reservación de ${res.clienteNombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Rechazar', style: 'destructive', onPress: doRechazar },
      ],
    );
  };

  const handleConfirmarPago = (metodo: 'efectivo' | 'tarjeta', cardNumber?: string, tipoCuenta?: 'debito' | 'credito') => {
    if (resParaPago) {
      dispatch({ 
        type: 'UPDATE_RESERVACION', 
        payload: { ...resParaPago, estado: 'pagado' } 
      });
      
      const pago: Pago = {
        id: generateId(),
        folioPago: generarFolioPago(state.pagos.length),
        reservacionId: resParaPago.id,
        metodoPago: metodo,
        monto: resParaPago.total,
        ultimos4: metodo === 'tarjeta' && cardNumber ? cardNumber.slice(-4) : undefined,
        tipoCuenta: metodo === 'tarjeta' ? (tipoCuenta || 'credito') : undefined,
        procesadoPor: state.user?.id || undefined,
        procesadoAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_PAGO', payload: pago });

      registrarBitacora(
        'PAGO_PROCESADO',
        `Pago procesado (${metodo}) para folio ${resParaPago.folio}`,
        { folio: resParaPago.folio, metodo, pagoId: pago.id }
      );
    }
    setPagoModalVisible(false);
    setResParaPago(null);
    Alert.alert('Pago Exitoso', 'La transacción se ha completado correctamente y se ha emitido el comprobante.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reservaciones</Text>
          <Text style={styles.subtitle}>{filtradas.length} total</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: Colors.neutral[200] }]}
            onPress={async () => {
              setRefreshing(true);
              await refreshData();
              setRefreshing(false);
            }}
            disabled={refreshing}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(admin)/reservaciones/nueva')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addText}>Nueva</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={busqueda}
          onChangeText={t => { setBusqueda(t); setPagina(1); }}
          placeholder="Buscar folio o cliente..."
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pendientes' && styles.tabBtnActive]}
            onPress={() => { setActiveTab('pendientes'); setPagina(1); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'pendientes' && styles.tabTextActive]}>
              Pendientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'aceptadas' && styles.tabBtnActive]}
            onPress={() => { setActiveTab('aceptadas'); setPagina(1); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'aceptadas' && styles.tabTextActive]}>
              Aceptadas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'historial' && styles.tabBtnActive]}
            onPress={() => { setActiveTab('historial'); setPagina(1); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'historial' && styles.tabTextActive]}>
              Historial
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={paginadas}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
        onEndReached={() => { if (hayMas) setPagina(p => p + 1); }}
        onEndReachedThreshold={0.2}
        renderItem={({ item: res }) => (
          <ResCard
            res={res}
            isHistorial={activeTab === 'historial'}
            onEdit={() => router.push(`/(admin)/reservaciones/${res.id}`)}
            onDelete={() => handleDelete(res)}
            onVerBoleto={() => {
              setResParaBoleto(res);
              setBoletoModalVisible(true);
            }}
            onProcesarPago={() => {
              setResParaPago(res);
              setPagoModalVisible(true);
            }}
            onAceptar={() => handleAceptar(res)}
            onRechazar={() => handleRechazar(res)}
          />
        )}
        ListFooterComponent={
          hayMas ? (
            <TouchableOpacity style={styles.loadMore} onPress={() => setPagina(p => p + 1)}>
              <Text style={styles.loadMoreText}>Cargar más...</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <PagoModal
        visible={pagoModalVisible}
        res={resParaPago}
        onClose={() => {
          setPagoModalVisible(false);
          setResParaPago(null);
        }}
        onConfirm={handleConfirmarPago}
      />

      <BoletoModal
        visible={boletoModalVisible}
        res={resParaBoleto}
        onClose={() => {
          setBoletoModalVisible(false);
          setResParaBoleto(null);
        }}
      />
    </SafeAreaView>
  );
}

// ── ResCard ────────────────────────────────────────────────────────────────────

function ResCard({
  res,
  isHistorial,
  onEdit,
  onDelete,
  onProcesarPago,
  onVerBoleto,
  onAceptar,
  onRechazar,
}: {
  res: Reservacion;
  isHistorial?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onProcesarPago?: () => void;
  onVerBoleto?: () => void;
  onAceptar?: () => void;
  onRechazar?: () => void;
}) {
  if (isHistorial) {
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
        {res.estado === 'pagado' && (
          <View style={styles.resActions}>
            <TouchableOpacity
              style={styles.btnProcesar}
              onPress={onVerBoleto || onEdit}
              activeOpacity={0.8}
            >
              <Ionicons name="ticket-outline" size={18} color={Colors.white} />
              <Text style={styles.btnProcesarText}>Ver Boleto</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  }

  return (
    <Card style={styles.resCard}>
      <View style={styles.resTop}>
        <View style={styles.resAvatar}>
          <Text style={styles.resAvatarText}>{getIniciales(res.clienteNombre)}</Text>
        </View>
        <View style={styles.resInfoWrapper}>
          <View style={styles.resInfoRow}>
            <Text style={styles.resFolio}>{res.folio}</Text>
            <Text style={styles.resTotal}>{formatMXN(res.total)}</Text>
          </View>
          <View style={styles.resInfoRow}>
            <Text style={styles.resNombre}>{res.clienteNombre}</Text>
          </View>
          <View style={[styles.resInfoRow, { alignItems: 'center' }]}>
            <Text style={styles.resDetalle}>
              {formatFecha(res.fechaPaseo)} · {res.horaPaseo} · {nombrePaquete(res.paquete)}
            </Text>
            <Badge estado={res.estado} size="sm" />
          </View>
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.resActions}>
        {res.estado === 'pendiente' ? (
          <View style={{ flexDirection: 'row', gap: Spacing[3], flex: 1 }}>
            <TouchableOpacity
              style={[styles.btnProcesar, { flex: 1, backgroundColor: Colors.danger }]}
              onPress={onRechazar}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color={Colors.white} />
              <Text style={styles.btnProcesarText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnProcesar, { flex: 1, backgroundColor: Colors.success }]}
              onPress={onAceptar}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
              <Text style={styles.btnProcesarText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        ) : res.estado === 'aceptada' ? (
          <TouchableOpacity
            style={styles.btnProcesar}
            onPress={onProcesarPago}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={18} color={Colors.white} />
            <Text style={styles.btnProcesarText}>Procesar Pago</Text>
          </TouchableOpacity>
        ) : res.estado === 'pagado' ? (
          <TouchableOpacity
            style={styles.btnProcesar}
            onPress={onVerBoleto || onEdit}
            activeOpacity={0.8}
          >
            <Ionicons name="ticket-outline" size={18} color={Colors.white} />
            <Text style={styles.btnProcesarText}>Ver Boleto</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Card>
  );
}

function EmptyState() {
  const router = useRouter();
  return (
    <View style={styles.empty}>
      <Ionicons name="calendar-outline" size={52} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>Sin reservaciones</Text>
      <Text style={styles.emptySub}>Crea la primera reservación del día</Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        onPress={() => router.push('/(admin)/reservaciones/nueva')}
      >
        <Text style={styles.emptyBtnText}>+ Nueva Reservación</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── BoletoModal ──────────────────────────────────────────────────────────────────

function BoletoModal({
  visible,
  res,
  onClose,
}: {
  visible: boolean;
  res: Reservacion | null;
  onClose: () => void;
}) {
  if (!res) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: Colors.primary[600] }]}>
          {/* Ticket Header */}
          <View style={[styles.modalHeader, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
            <View>
              <Text style={[styles.modalTitle, { color: Colors.white }]}>Boleto de Abordaje</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{res.folio}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 500 }}>
            <View style={{ padding: Spacing[6], gap: Spacing[5] }}>
              
              {/* QR / Icon Placeholder */}
              <View style={{ alignSelf: 'center', backgroundColor: Colors.white, padding: 15, borderRadius: 12 }}>
                <Ionicons name="qr-code" size={120} color={Colors.primary[600]} />
              </View>

              <View style={{ gap: Spacing[4] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={styles.ticketLabel}>PASAJERO</Text>
                    <Text style={styles.ticketValue}>{res.clienteNombre}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ticketLabel}>CANTIDAD</Text>
                    <Text style={styles.ticketValue}>{res.numPersonas} Pax</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={styles.ticketLabel}>FECHA</Text>
                    <Text style={styles.ticketValue}>{formatFecha(res.fechaPaseo)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.ticketLabel}>HORA</Text>
                    <Text style={styles.ticketValue}>{res.horaPaseo}</Text>
                  </View>
                </View>

                <View>
                  <Text style={styles.ticketLabel}>PAQUETE SELECCIONADO</Text>
                  <Text style={styles.ticketValue}>{nombrePaquete(res.paquete)}</Text>
                </View>

                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Total Pagado</Text>
                  <Text style={{ color: Colors.tertiary[400], fontSize: 24, fontWeight: '800' }}>{formatMXN(res.total)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={{ padding: Spacing[4], borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
            <TouchableOpacity 
              style={{ backgroundColor: Colors.white, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
              onPress={onClose}
            >
              <Text style={{ color: Colors.primary[600], fontWeight: 'bold' }}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── PagoModal ──────────────────────────────────────────────────────────────────

function PagoModal({
  visible,
  res,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  res: Reservacion | null;
  onClose: () => void;
  onConfirm: (metodo: 'efectivo' | 'tarjeta', cardNumber?: string, tipoCuenta?: 'debito' | 'credito') => void;
}) {
  const [metodo, setMetodo] = useState<'efectivo' | 'tarjeta'>('efectivo');
  const [cardNumber, setCardNumber] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState<'debito' | 'credito'>('credito');

  if (!res) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Intención de Pago</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalFolio}>{res.folio} — {res.clienteNombre}</Text>
            
            <View style={styles.metodoContainer}>
              <TouchableOpacity
                style={[styles.metodoBtn, metodo === 'efectivo' && styles.metodoBtnActive]}
                onPress={() => setMetodo('efectivo')}
                activeOpacity={0.8}
              >
                <Ionicons name="cash-outline" size={20} color={metodo === 'efectivo' ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.metodoText, metodo === 'efectivo' && styles.metodoTextActive]}>Efectivo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.metodoBtn, metodo === 'tarjeta' && styles.metodoBtnActive]}
                onPress={() => setMetodo('tarjeta')}
                activeOpacity={0.8}
              >
                <Ionicons name="card-outline" size={20} color={metodo === 'tarjeta' ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.metodoText, metodo === 'tarjeta' && styles.metodoTextActive]}>Tarjeta</Text>
              </TouchableOpacity>
            </View>

            {metodo === 'tarjeta' && (
              <View style={styles.formGroup}>
                <View>
                  <Text style={styles.label}>Número de cuenta</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0000 0000 0000 0000"
                    keyboardType="numeric"
                    placeholderTextColor={Colors.textMuted}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    maxLength={16}
                  />
                </View>
                <View>
                  <Text style={styles.label}>Tipo de cuenta</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                    <TouchableOpacity
                      style={[styles.metodoBtn, { flex: 1 }, tipoCuenta === 'debito' && styles.metodoBtnActive]}
                      onPress={() => setTipoCuenta('debito')}
                    >
                      <Text style={[styles.metodoText, tipoCuenta === 'debito' && styles.metodoTextActive]}>Débito</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.metodoBtn, { flex: 1 }, tipoCuenta === 'credito' && styles.metodoBtnActive]}
                      onPress={() => setTipoCuenta('credito')}
                    >
                      <Text style={[styles.metodoText, tipoCuenta === 'credito' && styles.metodoTextActive]}>Crédito</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.montoContainer}>
              <Text style={styles.montoLabel}>Monto a pagar</Text>
              <Text style={styles.montoValue}>{formatMXN(res.total)}</Text>
            </View>

            <TouchableOpacity
              style={styles.btnConfirmarModal}
              onPress={() => onConfirm(metodo, cardNumber, tipoCuenta)}
              activeOpacity={0.8}
            >
              <Text style={styles.btnConfirmarText}>
                {metodo === 'efectivo' ? 'Confirmar Pago en Efectivo' : 'Realizar Transacción'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  subtitle: { fontSize: FontSize.xs, color: Colors.textMuted },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary[500],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  addText: { color: Colors.white, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },

  searchWrap: { padding: Spacing[3], backgroundColor: Colors.white },

  tabsContainer: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    backgroundColor: Colors.white,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.md,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing[2],
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary[700],
    fontWeight: FontWeight.bold,
  },

  list: { padding: Spacing[4], gap: Spacing[3], paddingBottom: 80 },

  resCard: { 
    padding: Spacing[4],
    gap: Spacing[3],
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resTop: { flexDirection: 'row', gap: Spacing[3] },
  resAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center', alignItems: 'center',
  },
  resAvatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  resInfoWrapper: { flex: 1, gap: 4, justifyContent: 'center' },
  resInfo: { flex: 1 },
  resRight: { alignItems: 'flex-end', gap: 4 },
  resInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resFolio: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  resTotal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  resNombre: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  resDetalle: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1, paddingRight: 8 },

  resActions: {
    marginTop: Spacing[1],
  },
  btnProcesar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary[500],
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  btnProcesarText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  actionBtnRow: { flexDirection: 'row', gap: Spacing[2] },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: BorderRadius.md,
  },
  actionText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  loadMore: { padding: Spacing[4], alignItems: 'center' },
  loadMoreText: { color: Colors.secondary[500], fontWeight: FontWeight.medium },

  empty: { alignItems: 'center', paddingVertical: Spacing[12], gap: Spacing[3] },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  emptySub: { fontSize: FontSize.base, color: Colors.textMuted },
  emptyBtn: {
    backgroundColor: Colors.secondary[500],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    marginTop: Spacing[2],
  },
  emptyBtnText: { color: Colors.white, fontWeight: FontWeight.bold },

  // Modal de Pago
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing[4],
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary[700] },
  modalBody: { padding: Spacing[4], gap: Spacing[4] },
  modalFolio: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing[2] },
  metodoContainer: { flexDirection: 'row', gap: Spacing[3] },
  metodoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: Spacing[3], borderRadius: BorderRadius.md, gap: 8,
    backgroundColor: Colors.neutral[50], borderWidth: 1, borderColor: Colors.border,
  },
  metodoBtnActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  metodoText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  metodoTextActive: { color: Colors.white },
  formGroup: { gap: Spacing[3], marginTop: Spacing[2] },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3], paddingVertical: 10, fontSize: FontSize.sm,
    backgroundColor: Colors.white, color: Colors.textPrimary,
  },
  montoContainer: { alignItems: 'center', marginVertical: Spacing[2] },
  montoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  montoValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, color: Colors.primary[700] },
  btnConfirmarModal: {
    backgroundColor: Colors.secondary[500],
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  btnConfirmarText: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.base },

  // Ticket Modal Specifics
  ticketLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  ticketValue: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
