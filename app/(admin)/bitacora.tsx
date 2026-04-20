/**
 * Bitácora — Solo Admin.
 * Registro de todas las acciones del sistema.
 */

import React, { useMemo, useState } from 'react';
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
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { useAppStore } from '@/src/core/store/AppContext';
import { BitacoraEntry, BitacoraTipo, ETIQUETA_BITACORA } from '@/src/core/types/bitacora.types';
import { formatFechaHora } from '@/src/core/utils/formatters';
import { StorageService } from '@/src/core/services/storage.service';
import { Card } from '@/src/shared/components/ui/Card';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

const TIPO_CONFIG: Record<BitacoraTipo, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  RESERVACION_CREADA:    { icon: 'add-circle',       color: Colors.secondary[500], bg: Colors.secondary[50] },
  RESERVACION_EDITADA:   { icon: 'pencil',            color: Colors.info,           bg: Colors.infoLight },
  RESERVACION_ELIMINADA: { icon: 'trash',             color: Colors.danger,         bg: Colors.dangerLight },
  RESERVACION_ACEPTADA:  { icon: 'checkmark-circle',  color: Colors.success,        bg: Colors.successLight },
  RESERVACION_RECHAZADA: { icon: 'close-circle',      color: Colors.danger,         bg: Colors.dangerLight },
  PAGO_PROCESADO:        { icon: 'card',              color: Colors.primary[500],   bg: Colors.primary[50] },
  CONFIG_MODIFICADA:     { icon: 'settings',          color: Colors.tertiary[500],  bg: Colors.tertiary[50] },
  LOGIN:                 { icon: 'log-in',            color: Colors.textSecondary,  bg: Colors.neutral[100] },
  LOGOUT:                { icon: 'log-out',           color: Colors.textMuted,      bg: Colors.neutral[100] },
};

const FILTROS: { key: string; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'RESERVACION', label: 'Reservaciones' },
  { key: 'PAGO', label: 'Pagos' },
  { key: 'CONFIG', label: 'Configuración' },
  { key: 'LOGIN', label: 'Sesiones' },
];

export default function BitacoraScreen() {
  const { state } = useAppStore();
  const [filtro, setFiltro] = useState('todos');
  const [exportando, setExp] = useState(false);

  const filtradas = useMemo(() => {
    return state.bitacora.filter(e =>
      filtro === 'todos' || e.tipo.includes(filtro)
    );
  }, [state.bitacora, filtro]);

  const handleExportar = async () => {
    setExp(true);
    try {
      const json = await StorageService.exportarTodo();
      const path = `${FileSystem.documentDirectory}respaldo_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar respaldo del sistema',
      });
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar el respaldo.');
    }
    setExp(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bitácora</Text>
          <Text style={styles.subtitle}>{filtradas.length} registros</Text>
        </View>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExportar}
          disabled={exportando}
        >
          <Ionicons name="cloud-download" size={16} color={Colors.primary[500]} />
          <Text style={styles.exportText}>{exportando ? 'Exportando...' : 'Respaldo'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosRow}>
        {FILTROS.map(f => (
          <TouchableOpacity key={f.key} onPress={() => setFiltro(f.key)}
            style={[styles.chip, filtro === f.key && styles.chipActive]}>
            <Text style={[styles.chipText, filtro === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista */}
      <FlatList
        data={filtradas}
        keyExtractor={e => e.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="journal-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Sin registros</Text>
          </View>
        }
        renderItem={({ item }) => <BitacoraRow entry={item} />}
      />
    </SafeAreaView>
  );
}

// ── BitacoraRow ────────────────────────────────────────────────────────────────

function BitacoraRow({ entry }: { entry: BitacoraEntry }) {
  const cfg = TIPO_CONFIG[entry.tipo] ?? TIPO_CONFIG.LOGIN;
  return (
    <Card style={styles.entryCard}>
      <View style={styles.entryTop}>
        <View style={[styles.entryIcon, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={styles.entryInfo}>
          <Text style={styles.entryTipo}>{ETIQUETA_BITACORA[entry.tipo]}</Text>
          <Text style={styles.entryDesc}>{entry.descripcion}</Text>
          <View style={styles.entryMeta}>
            <Ionicons name="person-circle" size={12} color={Colors.textMuted} />
            <Text style={styles.entryUsuario}>{entry.usuario}</Text>
            <Text style={styles.entryTimestamp}>{formatFechaHora(entry.createdAt)}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing[4], backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary[500] },
  subtitle: { fontSize: FontSize.xs, color: Colors.textMuted },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing[3], paddingVertical: 8,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary[200],
    backgroundColor: Colors.primary[50],
  },
  exportText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary[500] },

  filtrosRow: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    gap: Spacing[2], backgroundColor: Colors.white,
  },
  chip: {
    paddingHorizontal: Spacing[3], paddingVertical: 6, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.neutral[50],
  },
  chipActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.white, fontWeight: FontWeight.bold },

  list: { padding: Spacing[4], gap: Spacing[2], paddingBottom: 40 },

  entryCard: { gap: Spacing[2] },
  entryTop: { flexDirection: 'row', gap: Spacing[3] },
  entryIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  entryInfo: { flex: 1, gap: 3 },
  entryTipo: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  entryDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  entryUsuario: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  entryTimestamp: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: 'auto' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing[3] },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary },
});
