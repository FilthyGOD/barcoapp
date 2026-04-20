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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppStore } from '@/src/core/store/AppContext';
import { Reservacion } from '@/src/core/types/reservacion.types';
import { filtrarReservaciones } from '@/src/core/services/reservaciones.service';
import {
  formatMXN,
  formatFecha,
  getIniciales,
  nombrePaquete,
} from '@/src/core/utils/formatters';
import { SearchBar } from '@/src/shared/components/ui/SearchBar';
import { Badge } from '@/src/shared/components/ui/Badge';
import { Card } from '@/src/shared/components/ui/Card';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

type FiltroEstado = 'todos' | 'pendiente' | 'aceptada' | 'pagado' | 'rechazada';
const FILTROS: { key: FiltroEstado; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'aceptada', label: 'Aceptadas' },
  { key: 'pagado', label: 'Pagadas' },
  { key: 'rechazada', label: 'Rechazadas' },
];

const PAGE_SIZE = 10;

export default function ReservacionesScreen() {
  const { state, dispatch, registrarBitacora } = useAppStore();
  const router = useRouter();

  const [busqueda, setBusqueda]   = useState('');
  const [filtro, setFiltro]       = useState<FiltroEstado>('todos');
  const [pagina, setPagina]       = useState(1);

  const filtradas = useMemo(() => {
    return filtrarReservaciones(state.reservaciones, {
      estado: filtro === 'todos' ? undefined : filtro,
      busqueda,
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.reservaciones, filtro, busqueda]);

  const paginadas = filtradas.slice(0, pagina * PAGE_SIZE);
  const hayMas    = paginadas.length < filtradas.length;

  const handleDelete = (res: Reservacion) => {
    Alert.alert(
      'Eliminar reservación',
      `¿Estás segura de eliminar ${res.folio} — ${res.clienteNombre}?\nEsta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'DELETE_RESERVACION', payload: res.id });
            registrarBitacora(
              'RESERVACION_ELIMINADA',
              `Reservación ${res.folio} eliminada — ${res.clienteNombre}`,
              { folio: res.folio },
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Reservaciones</Text>
          <Text style={styles.subtitle}>{filtradas.length} total</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(usuario)/reservaciones/nueva')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={busqueda}
          onChangeText={t => { setBusqueda(t); setPagina(1); }}
          placeholder="Buscar folio o cliente..."
        />
      </View>

      {/* Filtros de estado */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosRow}>
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => { setFiltro(f.key); setPagina(1); }}
            style={[styles.chip, filtro === f.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, filtro === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
            onEdit={() => router.push(`/(usuario)/reservaciones/${res.id}`)}
            onDelete={() => handleDelete(res)}
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
    </SafeAreaView>
  );
}

// ── ResCard ────────────────────────────────────────────────────────────────────

function ResCard({
  res,
  onEdit,
  onDelete,
}: {
  res: Reservacion;
  onEdit: () => void;
  onDelete: () => void;
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
            {formatFecha(res.fechaPaseo)} · {res.horaPaseo}
          </Text>
          <Text style={styles.resDetalle}>
            {nombrePaquete(res.paquete)} · {res.numPersonas} pers.
          </Text>
        </View>
        <View style={styles.resRight}>
          <Text style={styles.resTotal}>{formatMXN(res.total)}</Text>
          <Badge estado={res.estado} size="sm" />
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.resActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.primary[50] }]}
          onPress={onEdit}
        >
          <Ionicons name="pencil" size={14} color={Colors.primary[500]} />
          <Text style={[styles.actionText, { color: Colors.primary[500] }]}>Editar</Text>
        </TouchableOpacity>
        {res.estado === 'pendiente' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.estadoRechazadoLight }]}
            onPress={onDelete}
          >
            <Ionicons name="trash" size={14} color={Colors.danger} />
            <Text style={[styles.actionText, { color: Colors.danger }]}>Eliminar</Text>
          </TouchableOpacity>
        )}
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
        onPress={() => router.push('/(usuario)/reservaciones/nueva')}
      >
        <Text style={styles.emptyBtnText}>+ Nueva Reservación</Text>
      </TouchableOpacity>
    </View>
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

  filtrosRow: {
    paddingHorizontal: Spacing[3],
    paddingBottom: Spacing[3],
    gap: Spacing[2],
    backgroundColor: Colors.white,
  },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.neutral[50],
  },
  chipActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.white, fontWeight: FontWeight.bold },

  list: { padding: Spacing[4], gap: Spacing[2], paddingBottom: 80 },

  resCard: { gap: Spacing[2] },
  resTop: { flexDirection: 'row', gap: Spacing[3] },
  resAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center', alignItems: 'center',
  },
  resAvatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  resInfo: { flex: 1, gap: 2 },
  resFolio: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'monospace' },
  resNombre: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  resDetalle: { fontSize: FontSize.xs, color: Colors.textSecondary },
  resRight: { alignItems: 'flex-end', gap: 4 },
  resTotal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary[500] },

  resActions: {
    flexDirection: 'row', gap: Spacing[2],
    paddingTop: Spacing[2],
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
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
});
