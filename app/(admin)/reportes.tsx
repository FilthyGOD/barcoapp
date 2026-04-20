/**
 * Reportes — Solo Admin.
 * Tabs: Reservaciones por día / Ingresos / Por tipo de servicio.
 * Exporta a PDF (expo-print) y JSON (expo-sharing).
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useAppStore } from '@/src/core/store/AppContext';
import { formatMXN, formatFecha } from '@/src/core/utils/formatters';
import { tendenciaMensual } from '@/src/core/services/reservaciones.service';
import { Card } from '@/src/shared/components/ui/Card';
import { Button } from '@/src/shared/components/ui/Button';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

type Tab = 'reservaciones' | 'ingresos' | 'servicios';
const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'reservaciones', label: 'Reservaciones', icon: 'calendar' },
  { key: 'ingresos',      label: 'Ingresos',      icon: 'trending-up' },
  { key: 'servicios',     label: 'Por Servicio',  icon: 'pie-chart' },
];

export default function ReportesScreen() {
  const { state } = useAppStore();
  const [tab, setTab]           = useState<Tab>('reservaciones');
  const [exportando, setExp]    = useState(false);

  const tendencia = useMemo(() => tendenciaMensual(state.reservaciones, 6), [state.reservaciones]);
  const maxIngreso = Math.max(...tendencia.map(t => t.ingresos), 1);

  // Agrupar por fecha
  const porDia = useMemo(() => {
    const map: Record<string, { total: number; ingresos: number; count: number }> = {};
    state.reservaciones.forEach(r => {
      if (!map[r.fechaPaseo]) map[r.fechaPaseo] = { total: 0, ingresos: 0, count: 0 };
      map[r.fechaPaseo].count++;
      if (r.estado === 'pagado') map[r.fechaPaseo].ingresos += r.total;
      map[r.fechaPaseo].total += r.total;
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 14)
      .map(([fecha, data]) => ({ fecha, ...data }));
  }, [state.reservaciones]);

  // Por tipo de servicio
  const porServicio = useMemo(() => {
    const map: Record<string, { count: number; ingresos: number }> = {
      comida: { count: 0, ingresos: 0 },
      bebidas: { count: 0, ingresos: 0 },
      paseo: { count: 0, ingresos: 0 },
    };
    state.reservaciones.forEach(r => {
      map[r.paquete].count++;
      if (r.estado === 'pagado') map[r.paquete].ingresos += r.total;
    });
    return Object.entries(map).map(([paquete, data]) => ({ paquete, ...data }));
  }, [state.reservaciones]);

  const totalIngresos = state.reservaciones
    .filter(r => r.estado === 'pagado')
    .reduce((s, r) => s + r.total, 0);

  const exportarPDF = async () => {
    setExp(true);
    try {
      const html = generarHTMLReporte(state.reservaciones, tendencia, totalIngresos, state.config.nombreNegocio);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Exportar Reporte PDF' });
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el PDF.');
    }
    setExp(false);
  };

  const exportarJSON = async () => {
    setExp(true);
    try {
      const { StorageService } = await import('@/src/core/services/storage.service');
      const json = await StorageService.exportarTodo();
      const FileSystem = await import('expo-file-system');
      const path = `${FileSystem.documentDirectory}reporte_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, json);
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Exportar datos JSON' });
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar los datos.');
    }
    setExp(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reportes</Text>
        <View style={styles.exportBtns}>
          <TouchableOpacity style={styles.exportBtn} onPress={exportarPDF} disabled={exportando}>
            <Ionicons name="document-text" size={16} color={Colors.danger} />
            <Text style={[styles.exportText, { color: Colors.danger }]}>PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={exportarJSON} disabled={exportando}>
            <Ionicons name="download" size={16} color={Colors.secondary[500]} />
            <Text style={[styles.exportText, { color: Colors.secondary[500] }]}>JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}>
            <Ionicons name={t.icon} size={16} color={tab === t.key ? Colors.white : Colors.textMuted} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Resumen total */}
        <Card style={styles.totalCard}>
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Ingresos Totales</Text>
              <Text style={styles.totalValue}>{formatMXN(totalIngresos)}</Text>
            </View>
            <View>
              <Text style={styles.totalLabel}>Reservaciones</Text>
              <Text style={[styles.totalValue, { color: Colors.secondary[500] }]}>{state.reservaciones.length}</Text>
            </View>
            <View>
              <Text style={styles.totalLabel}>Pagadas</Text>
              <Text style={[styles.totalValue, { color: Colors.success }]}>
                {state.reservaciones.filter(r => r.estado === 'pagado').length}
              </Text>
            </View>
          </View>
        </Card>

        {/* Tab: Reservaciones por día */}
        {tab === 'reservaciones' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reservaciones por Día (últimos 14 días)</Text>
            {porDia.map((d, i) => (
              <Card key={i} style={styles.rowCard}>
                <View style={styles.rowCardInner}>
                  <Text style={styles.rowDate}>{formatFecha(d.fecha)}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.barH, { width: `${Math.min((d.count / 10) * 100, 100)}%` }]} />
                  </View>
                  <Text style={styles.rowCount}>{d.count} res.</Text>
                  <Text style={styles.rowIngresos}>{formatMXN(d.ingresos)}</Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Tab: Ingresos */}
        {tab === 'ingresos' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tendencia de Ingresos (6 meses)</Text>
            <Card>
              <View style={styles.chartWrap}>
                {tendencia.map((item, i) => (
                  <View key={i} style={styles.bar}>
                    <Text style={styles.barValTop}>
                      {item.ingresos > 0 ? formatMXN(item.ingresos).replace('MX$', '') : ''}
                    </Text>
                    <View style={[styles.barFill, { height: Math.max(4, (item.ingresos / maxIngreso) * 100) }]} />
                    <Text style={styles.barLabel}>{item.mes}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <View style={styles.ingresosTable}>
              {tendencia.map((item, i) => (
                <View key={i} style={styles.ingresosRow}>
                  <Text style={styles.ingresosLabel}>{item.mes}</Text>
                  <Text style={styles.ingresosVal}>{formatMXN(item.ingresos)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab: Por tipo de servicio */}
        {tab === 'servicios' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribución por Paquete</Text>
            {porServicio.map((s, i) => {
              const totalRes = state.reservaciones.length || 1;
              const pct = Math.round((s.count / totalRes) * 100);
              const label = s.paquete === 'comida' ? '🍽 Con Comida' : s.paquete === 'bebidas' ? '🥤 Solo Bebidas' : '⚓ Solo Paseo';
              const color = s.paquete === 'comida' ? Colors.secondary[500] : s.paquete === 'bebidas' ? Colors.info : Colors.tertiary[500];
              return (
                <Card key={i} style={styles.servicioCard}>
                  <View style={styles.servicioHeader}>
                    <Text style={styles.servicioLabel}>{label}</Text>
                    <Text style={styles.servicioPct}>{pct}%</Text>
                  </View>
                  <View style={styles.servicioBar}>
                    <View style={[styles.servicioBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                  <View style={styles.servicioStats}>
                    <Text style={styles.servicioStat}>{s.count} reservaciones</Text>
                    <Text style={[styles.servicioStat, { fontWeight: FontWeight.bold, color: Colors.primary[500] }]}>{formatMXN(s.ingresos)}</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Generador HTML para PDF ────────────────────────────────────────────────────

function generarHTMLReporte(reservaciones: any[], tendencia: any[], totalIngresos: number, negocio: string): string {
  const filas = reservaciones.slice(0, 30).map(r => `
    <tr>
      <td>${r.folio}</td>
      <td>${r.clienteNombre}</td>
      <td>${r.fechaPaseo}</td>
      <td>${r.paquete}</td>
      <td>${r.numPersonas}</td>
      <td>$${r.total.toLocaleString('es-MX')}</td>
      <td>${r.estado}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Reporte — ${negocio}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #0F1A21; padding: 32px; }
      h1 { color: #00416A; } h2 { color: #00A3A3; font-size: 14px; }
      .metric { display: inline-block; margin: 0 24px 16px 0; }
      .metric-val { font-size: 28px; font-weight: bold; color: #00416A; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; }
      th { background: #00416A; color: white; padding: 8px; text-align: left; }
      td { padding: 6px 8px; border-bottom: 1px solid #E8EDF2; }
      tr:nth-child(even) { background: #F4F7F9; }
      .footer { margin-top: 40px; font-size: 10px; color: #8EA5B4; text-align: center; }
    </style></head><body>
    <h1>📊 Reporte de Reservaciones</h1>
    <p>${negocio} · Generado el ${new Date().toLocaleDateString('es-MX', { dateStyle: 'full' })}</p>
    <div>
      <div class="metric"><div>Total Reservaciones</div><div class="metric-val">${reservaciones.length}</div></div>
      <div class="metric"><div>Ingresos Totales</div><div class="metric-val">$${totalIngresos.toLocaleString('es-MX')}</div></div>
      <div class="metric"><div>Reservaciones Pagadas</div><div class="metric-val">${reservaciones.filter(r => r.estado === 'pagado').length}</div></div>
    </div>
    <h2>DETALLE DE RESERVACIONES (últimas 30)</h2>
    <table><thead><tr><th>Folio</th><th>Cliente</th><th>Fecha</th><th>Paquete</th><th>Personas</th><th>Total</th><th>Estado</th></tr></thead>
    <tbody>${filas}</tbody></table>
    <div class="footer">Sistema de Reservaciones — ${negocio}</div>
    </body></html>`;
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
  exportBtns: { flexDirection: 'row', gap: Spacing[2] },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing[3], paddingVertical: 6,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  exportText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  tabsRow: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    gap: Spacing[2], backgroundColor: Colors.white,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.neutral[50],
  },
  tabBtnActive: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white, fontWeight: FontWeight.bold },

  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: 40 },

  totalCard: { flexDirection: 'row' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', flex: 1 },
  totalLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 4 },
  totalValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.primary[500] },

  section: { gap: Spacing[3] },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  rowCard: { paddingVertical: Spacing[2] },
  rowCardInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  rowDate: { fontSize: FontSize.xs, color: Colors.textSecondary, width: 90 },
  barH: { height: 8, backgroundColor: Colors.secondary[300], borderRadius: 4 },
  rowCount: { fontSize: FontSize.xs, color: Colors.textMuted, width: 40, textAlign: 'right' },
  rowIngresos: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary[500], width: 80, textAlign: 'right' },

  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, paddingTop: Spacing[3] },
  bar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barFill: { width: '60%', backgroundColor: Colors.secondary[400], borderRadius: 4 },
  barLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  barValTop: { fontSize: 9, color: Colors.secondary[600], fontWeight: FontWeight.bold },

  ingresosTable: { gap: Spacing[1] },
  ingresosRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing[2], paddingHorizontal: Spacing[3],
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
  },
  ingresosLabel: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  ingresosVal: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary[500] },

  servicioCard: { gap: Spacing[2] },
  servicioHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  servicioLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  servicioPct: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.primary[500] },
  servicioBar: { height: 12, backgroundColor: Colors.neutral[100], borderRadius: BorderRadius.full, overflow: 'hidden' },
  servicioBarFill: { height: '100%', borderRadius: BorderRadius.full },
  servicioStats: { flexDirection: 'row', justifyContent: 'space-between' },
  servicioStat: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
