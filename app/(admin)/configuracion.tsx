/**
 * Configuración — Solo Admin.
 * Editar precios de paquetes, porcentaje de descuento y datos del negocio.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAppStore } from '@/src/core/store/AppContext';
import { ConfigState } from '@/src/core/types/bitacora.types';
import { formatMXN } from '@/src/core/utils/formatters';
import { Input } from '@/src/shared/components/ui/Input';
import { Button } from '@/src/shared/components/ui/Button';
import { Card } from '@/src/shared/components/ui/Card';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

export default function ConfiguracionScreen() {
  const { state, dispatch, registrarBitacora } = useAppStore();
  const [config, setConfig] = useState<ConfigState>(state.config);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty]   = useState(false);

  const update = (key: keyof ConfigState, value: any) => {
    setConfig(c => ({ ...c, [key]: value }));
    setDirty(true);
  };

  const updatePrecio = (paquete: keyof ConfigState['precios'], value: string) => {
    const num = parseInt(value.replace(/\D/g, ''), 10) || 0;
    setConfig(c => ({ ...c, precios: { ...c.precios, [paquete]: num } }));
    setDirty(true);
  };

  const handleGuardar = async () => {
    if (!config.nombreNegocio.trim()) { Alert.alert('Error', 'El nombre del negocio es obligatorio.'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    dispatch({ type: 'SET_CONFIG', payload: config });
    registrarBitacora('CONFIG_MODIFICADA', 'Configuración del sistema actualizada');
    setSaving(false);
    setDirty(false);
    Alert.alert('✅ Guardado', 'La configuración ha sido actualizada.');
  };

  const handleReset = () => {
    Alert.alert('Restablecer', '¿Restaurar configuración por defecto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restablecer', style: 'destructive',
        onPress: () => {
          const def: ConfigState = {
            precios: { comida: 450, bebidas: 350, paseo: 250 },
            porcentajeDescuento: 10,
            minPersonasDescuento: 5,
            nombreNegocio: 'Barco Pirata de Puerto Peñasco',
            telefono: '(638) 383-1234',
            direccion: 'Malecón Kino s/n, Puerto Peñasco, Sonora',
          };
          setConfig(def);
          setDirty(true);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Configuración</Text>
        {dirty && <Text style={styles.unsavedBadge}>Sin guardar</Text>}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Precios de paquetes ── */}
        <SectionCard
          icon="pricetag"
          title="Precios de Paquetes"
          subtitle="Se aplican al calcular nuevas reservaciones"
        >
          <PrecioRow
            icon="🍽"
            label="Con Comida"
            value={String(config.precios.comida)}
            onChangeText={t => updatePrecio('comida', t)}
          />
          <PrecioRow
            icon="🥤"
            label="Solo Bebidas"
            value={String(config.precios.bebidas)}
            onChangeText={t => updatePrecio('bebidas', t)}
          />
          <PrecioRow
            icon="⚓"
            label="Solo Paseo"
            value={String(config.precios.paseo)}
            onChangeText={t => updatePrecio('paseo', t)}
          />
        </SectionCard>

        {/* ── Descuentos ── */}
        <SectionCard
          icon="gift"
          title="Descuentos Grupales"
          subtitle={`Actualmente: ${config.porcentajeDescuento}% para grupos de ${config.minPersonasDescuento}+ personas`}
        >
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input
                label="Porcentaje descuento (%)"
                value={String(config.porcentajeDescuento)}
                onChangeText={t => update('porcentajeDescuento', parseInt(t.replace(/\D/g, ''), 10) || 0)}
                keyboardType="numeric"
                leftIcon="percent"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Mínimo de personas"
                value={String(config.minPersonasDescuento)}
                onChangeText={t => update('minPersonasDescuento', parseInt(t.replace(/\D/g, ''), 10) || 1)}
                keyboardType="numeric"
                leftIcon="people"
              />
            </View>
          </View>

          <Card style={styles.previewCard}>
            <Text style={styles.previewLabel}>Vista previa — grupo de 6 personas, paquete Con Comida:</Text>
            <Text style={styles.previewVal}>
              Subtotal: {formatMXN(config.precios.comida * 6)} → Con descuento: {formatMXN(config.precios.comida * 6 * (1 - config.porcentajeDescuento / 100))}
            </Text>
          </Card>
        </SectionCard>

        {/* ── Datos del negocio ── */}
        <SectionCard icon="business" title="Datos del Negocio" subtitle="Aparecen en comprobantes y reportes">
          <Input
            label="Nombre del negocio"
            value={config.nombreNegocio}
            onChangeText={t => update('nombreNegocio', t)}
            leftIcon="boat"
          />
          <Input
            label="Teléfono de contacto"
            value={config.telefono}
            onChangeText={t => update('telefono', t)}
            keyboardType="phone-pad"
            leftIcon="call"
          />
          <Input
            label="Dirección"
            value={config.direccion}
            onChangeText={t => update('direccion', t)}
            leftIcon="location"
          />
        </SectionCard>

        {/* Acciones */}
        <View style={styles.actions}>
          <Button variant="outline" onPress={handleReset} style={{ flex: 1 }}>
            Restablecer
          </Button>
          <Button
            onPress={handleGuardar}
            loading={saving}
            disabled={!dirty}
            style={{ flex: 2 }}
          >
            💾 Guardar cambios
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function SectionCard({
  icon, title, subtitle, children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color={Colors.secondary[500]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </Card>
  );
}

function PrecioRow({
  icon, label, value, onChangeText,
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.precioRow}>
      <Text style={styles.precioIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.precioLabel}>{label}</Text>
      </View>
      <View style={styles.precioInput}>
        <Text style={styles.pesoSign}>$</Text>
        <Input
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          containerStyle={{ flex: 1 }}
        />
      </View>
    </View>
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
  unsavedBadge: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.warning,
    backgroundColor: Colors.warningLight, paddingHorizontal: Spacing[2], paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  content: { padding: Spacing[4], gap: Spacing[4], paddingBottom: 40 },

  sectionCard: { gap: Spacing[4] },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  sectionIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary[50],
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  precioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  precioIcon: { fontSize: 22, width: 32 },
  precioLabel: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  precioInput: { flexDirection: 'row', alignItems: 'center', width: 110 },
  pesoSign: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginRight: 4 },

  row2: { flexDirection: 'row', gap: Spacing[3] },

  previewCard: {
    backgroundColor: Colors.secondary[50],
    borderWidth: 1, borderColor: Colors.secondary[200],
  },
  previewLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  previewVal: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.secondary[700] },

  actions: { flexDirection: 'row', gap: Spacing[3] },
});
