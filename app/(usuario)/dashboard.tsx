/**
 * Dashboard — Rol USUARIO (Tripulante).
 * Métricas del día + reservaciones recientes + FAB nueva reservación.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppStore } from '@/src/core/store/AppContext';
import { AuthService } from '@/src/core/services/auth.service';
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
import { Card } from '@/src/shared/components/ui/Card';
import { Badge } from '@/src/shared/components/ui/Badge';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

export default function UsuarioDashboard() {
  const { state, dispatch } = useAppStore();
  const router = useRouter();

  const handleLogout = () => {
    const performLogout = async () => {
      await AuthService.signOut();
      dispatch({ type: 'LOGOUT' });
      setTimeout(() => router.replace('/login'), 100);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar Sesión', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  // const deHoy = useMemo(() => reservacionesDeHoy(state.reservaciones), [state.reservaciones]);
  // const ingresos = useMemo(() => ingresosDeHoy(state.reservaciones), [state.reservaciones]);
  // const recientes = useMemo(
  //   () => [...state.reservaciones].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
  //   [state.reservaciones],
  // );
  // const tendencia = useMemo(() => tendenciaMensual(state.reservaciones), [state.reservaciones]);
  // const maxIngreso = Math.max(...tendencia.map(t => t.ingresos), 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>


        {/* ── Hero Section ── */}
        <View style={styles.heroWrap}>
          <ImageBackground 
            source={require('@/assets/images/login-bg.png')} 
            style={styles.heroBg} 
            imageStyle={styles.heroBgImage}
          >
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>Embark on a Legend</Text>
              <Text style={styles.heroSubtitle}>
                Master the high seas with Barco Pirata. Choose your voyage and write your own pirate tale under the Puerto Peñasco stars.
              </Text>
              <View style={styles.heroBadge}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.white} />
                <Text style={styles.heroBadgeText}>SAFE PASSAGE GUARANTEED</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* ── Greeting ── */}
        <View style={styles.greetingWrap}>
          <Text style={styles.greeting}>Bienvenida, {state.user?.name?.split(' ')[0]} ⚓</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>

        {/* ── Tipo de Paseo Cards ── */}
        <View style={styles.typeSectionWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeSection}>
            <View style={styles.typeCard}>
              <View style={styles.typeCardHeader}>
                <View>
                  <Text style={styles.typeCardPreTitle}>SOLO TRAVELERS & COUPLES</Text>
                  <Text style={styles.typeCardTitle}>Paseos{'\n'}individuales</Text>
                </View>
                <Ionicons name="person-outline" size={24} color={Colors.textPrimary} />
              </View>
              <Text style={styles.typeCardDesc}>
                Perfect for those seeking solitude or a romantic sunset getaway. Join a fellowship of fellow adventurers on our daily scheduled departures.
              </Text>
              <View style={styles.typeCardFeatures}>
                <FeatureItem text="Scheduled daily departures" />
                <FeatureItem text="Full access to ship decks" />
              </View>
              <TouchableOpacity style={styles.typeBtn} onPress={() => router.push('/(usuario)/reservaciones/nueva')}>
                <Text style={styles.typeBtnText}>BOOK NOW</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.typeCard}>
              <View style={styles.popularBadgeWrap}>
                <Text style={styles.popularBadgeText}>POPULAR CHOICE</Text>
              </View>
              <View style={styles.typeCardHeader}>
                <View>
                  <Text style={styles.typeCardPreTitle}>CREWS & CELEBRATIONS</Text>
                  <Text style={styles.typeCardTitle}>Paseos grupales</Text>
                </View>
                <Ionicons name="people-outline" size={24} color={Colors.textPrimary} />
              </View>
              <Text style={styles.typeCardDesc}>
                Command the entire vessel for your private crew. Ideal for birthdays, corporate events, or weddings.
              </Text>
              
              <View style={styles.bountyBox}>
                <Ionicons name="pricetag-outline" size={16} color={Colors.tertiary[700]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bountyBoxTitle}>Special Crew Bounty</Text>
                  <Text style={styles.bountyBoxSub}>10% discount for groups of 15+ members</Text>
                </View>
              </View>

              <View style={styles.typeCardFeatures}>
                <FeatureItem text="Custom itinerary options" />
                <FeatureItem text="Private Captain's service" />
              </View>
              <TouchableOpacity style={styles.typeBtn} onPress={() => router.push('/(usuario)/reservaciones/nueva')}>
                <Text style={styles.typeBtnText}>BOOK NOW</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ── Métricas Ocultas Temporalmente ── */}

        {/* ── Servicios y Costos (Premium Cards) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nuestros Paquetes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packagesScroll}>
            
            {/* Tarjeta 1: Solo Paseo */}
            <TouchableOpacity activeOpacity={0.9} style={styles.packageCard}>
              <View style={[styles.pkgIconWrap, { backgroundColor: Colors.tertiary[100] }]}>
                <Ionicons name="boat" size={24} color={Colors.tertiary[600]} />
              </View>
              <Text style={styles.pkgTitle}>Solo paseo</Text>
              <View style={styles.pkgPriceRow}>
                <Text style={styles.pkgPrice}>$250</Text>
                <Text style={styles.pkgCurrency}> / MXN</Text>
              </View>
              <View style={styles.pkgFeatures}>
                <FeatureItem text="3 horas de recorrido" />
                <FeatureItem text="Tour histórico" />
                <FeatureItem text="Show pirata" />
              </View>
              <TouchableOpacity style={styles.pkgBtnOutlined} onPress={() => router.push('/(usuario)/reservaciones/nueva')}>
                <Text style={styles.pkgBtnOutlinedText}>SELECCIONAR</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Tarjeta 2: Solo Bebidas */}
            <TouchableOpacity activeOpacity={0.9} style={styles.packageCard}>
              <View style={[styles.pkgIconWrap, { backgroundColor: Colors.tertiary[100] }]}>
                <Ionicons name="wine" size={24} color={Colors.tertiary[600]} />
              </View>
              <Text style={styles.pkgTitle}>Solo Bebidas</Text>
              <View style={styles.pkgPriceRow}>
                <Text style={styles.pkgPrice}>$350</Text>
                <Text style={styles.pkgCurrency}> / MXN</Text>
              </View>
              <View style={styles.pkgFeatures}>
                <FeatureItem text="Barra libre" />
                <FeatureItem text="Atardecer" />
                <FeatureItem text="Cócteles especiales" />
              </View>
              <TouchableOpacity style={styles.pkgBtnOutlined} onPress={() => router.push('/(usuario)/reservaciones/nueva')}>
                <Text style={styles.pkgBtnOutlinedText}>SELECCIONAR</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Tarjeta 3: Paseo con comida (Destacada) */}
            <TouchableOpacity activeOpacity={0.9} style={[styles.packageCard, styles.packageCardDark]}>
              <View style={[styles.pkgIconWrap, { backgroundColor: Colors.tertiary[500] }]}>
                <Ionicons name="restaurant" size={24} color={Colors.white} />
              </View>
              <Text style={[styles.pkgTitle, { color: Colors.tertiary[400] }]}>Con comida incluida</Text>
              <View style={styles.pkgPriceRow}>
                <Text style={[styles.pkgPrice, { color: Colors.tertiary[400] }]}>$450</Text>
                <Text style={[styles.pkgCurrency, { color: Colors.tertiary[600] }]}> / MXN</Text>
              </View>
              <View style={styles.pkgFeatures}>
                <FeatureItem text="Menú pirata gourmet" dark />
                <FeatureItem text="Barra libre incluida" dark />
                <FeatureItem text="Asientos VIP" dark />
              </View>
              <TouchableOpacity style={styles.pkgBtnSolid} onPress={() => router.push('/(usuario)/reservaciones/nueva')}>
                <Text style={styles.pkgBtnSolidText}>MEJOR OPCIÓN</Text>
              </TouchableOpacity>
            </TouchableOpacity>

          </ScrollView>
        </View>

        {/* ── Reservaciones Recientes Ocultas Temporalmente ── */}
      </ScrollView>
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

// ── FeatureItem ────────────────────────────────────────────────────────────────

function FeatureItem({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2] }}>
      <Ionicons name="checkmark-circle-outline" size={16} color={dark ? Colors.tertiary[400] : Colors.primary[500]} />
      <Text style={{ fontSize: FontSize.sm, color: dark ? Colors.white : Colors.textPrimary, flex: 1 }}>{text}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  greetingWrap: { paddingHorizontal: Spacing[4], marginBottom: Spacing[4] },
  greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  metricRow: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[3] },
  metricCard: { width: 165, gap: Spacing[2] },
  metricIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  metricValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  metricSub: { fontSize: FontSize.xs, color: Colors.textMuted },

  section: { paddingHorizontal: Spacing[4], marginBottom: Spacing[3] },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[3] },

  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, paddingTop: Spacing[2] },
  bar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barFill: { width: '60%', backgroundColor: Colors.secondary[400], borderRadius: 4 },
  barLabel: { fontSize: FontSize.xs, color: Colors.textMuted },

  resCard: { marginBottom: Spacing[2] },
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

  // Hero Section
  heroWrap: { margin: Spacing[4], borderRadius: BorderRadius.xl, overflow: 'hidden' },
  heroBg: { width: '100%', minHeight: 200, justifyContent: 'flex-end' },
  heroBgImage: { opacity: 0.9 },
  heroOverlay: { padding: Spacing[4], backgroundColor: 'rgba(0,0,0,0.4)', flex: 1, justifyContent: 'center' },
  heroTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.tertiary[300], marginBottom: Spacing[1], textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  heroSubtitle: { fontSize: FontSize.xs, color: Colors.white, marginBottom: Spacing[3], lineHeight: 18, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.secondary[500], paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: BorderRadius.full, alignSelf: 'flex-start', gap: Spacing[1] },
  heroBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.white },

  // Tipo de Paseo Cards
  typeSectionWrap: { marginBottom: Spacing[6] },
  typeSection: { paddingHorizontal: Spacing[4], gap: Spacing[4], alignItems: 'stretch' },
  typeCard: { width: 320, backgroundColor: Colors.tertiary[50], borderRadius: BorderRadius.lg, padding: Spacing[5], elevation: 2, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: 1, borderColor: Colors.tertiary[200] },
  typeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[3] },
  typeCardPreTitle: { fontSize: FontSize.xs, color: Colors.secondary[600], letterSpacing: 1, marginBottom: 2, textTransform: 'uppercase', fontWeight: FontWeight.bold },
  typeCardTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#3d2f13' },
  typeCardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing[4], lineHeight: 20 },
  typeCardFeatures: { marginBottom: Spacing[5], gap: Spacing[2], flex: 1 },
  typeBtn: { backgroundColor: Colors.primary[600], borderRadius: BorderRadius.md, paddingVertical: Spacing[3], alignItems: 'center' },
  typeBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  
  popularBadgeWrap: { position: 'absolute', top: -10, right: Spacing[4], backgroundColor: Colors.primary[500], paddingHorizontal: Spacing[2], paddingVertical: 4, borderRadius: BorderRadius.sm, zIndex: 10 },
  popularBadgeText: { color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  
  bountyBox: { flexDirection: 'row', backgroundColor: Colors.tertiary[200], borderRadius: BorderRadius.md, padding: Spacing[3], gap: Spacing[3], marginBottom: Spacing[4], alignItems: 'center' },
  bountyBoxTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.tertiary[900] },
  bountyBoxSub: { fontSize: FontSize.xs, color: Colors.tertiary[800], marginTop: 2 },

  // Paquetes / Servicios
  packagesScroll: { paddingHorizontal: Spacing[4], gap: Spacing[4], paddingBottom: Spacing[4] },
  packageCard: {
    width: 240,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  packageCardDark: {
    backgroundColor: '#2A1F1A', // Marrón oscuro pirata
    borderColor: Colors.tertiary[800],
  },
  pkgIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  pkgTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  pkgPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing[4],
  },
  pkgPrice: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.primary[600],
  },
  pkgCurrency: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  pkgFeatures: {
    marginBottom: Spacing[5],
    flex: 1,
  },
  pkgBtnOutlined: {
    borderWidth: 1,
    borderColor: Colors.tertiary[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  pkgBtnOutlinedText: {
    color: Colors.tertiary[600],
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },
  pkgBtnSolid: {
    backgroundColor: Colors.tertiary[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  pkgBtnSolidText: {
    color: '#2A1F1A',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: Spacing[4],
    backgroundColor: Colors.secondary[500],
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    elevation: 8,
    shadowColor: Colors.secondary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.base,
  },
});
