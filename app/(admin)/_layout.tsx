/**
 * Layout de navegación — Rol ADMIN.
 * Bottom tabs: Dashboard · Pagos · Reportes · Config
 */

import { Tabs, useRouter, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/src/core/store/AppContext';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { getIniciales } from '@/src/core/utils/formatters';

export default function AdminLayout() {
  const { state } = useAppStore();
  const router    = useRouter();
  const pathname  = usePathname();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  // Guard: si no es admin, redirige
  useEffect(() => {
    if (!state.isLoading && (!state.user || state.user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [state.user, state.isLoading]);

  // Conteo de pendientes para badge
  const pendientes = state.reservaciones.filter(r => r.estado === 'pendiente').length;

  return (
    <View style={styles.flex}>
      {isWide && <WebTopNavigation state={state} router={router} pathname={pathname} pendientes={pendientes} />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: isWide ? { display: 'none' } : {
            backgroundColor: Colors.white,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: Colors.secondary[500],
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarLabelStyle: {
            fontSize: FontSize.xs,
            fontWeight: FontWeight.semibold,
          },
        }}
      >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="grid" color={color} size={size} badge={pendientes} />
          ),
        }}
      />
      <Tabs.Screen
        name="pagos/index"
        options={{
          title: 'Pagos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
      {/* Rutas ocultas del tab bar */}
      <Tabs.Screen name="pagos/[id]" options={{ href: null }} />
    </Tabs>
    </View>
  );
}

// ── Navegación Web Superior ──────────────────────────────────────────────────

function WebTopNavigation({ state, router, pathname, pendientes }: any) {
  const tabs = [
    { key: '/dashboard', label: 'Inicio', icon: 'grid', badge: pendientes },
    { key: '/pagos', label: 'Pagos', icon: 'card' },
    { key: '/reportes', label: 'Reportes', icon: 'bar-chart' },
    { key: '/configuracion', label: 'Config', icon: 'settings' },
  ];

  return (
    <View style={styles.webNavContainer}>
      {/* Tier 1: Blue Header */}
      <LinearGradient
        colors={[Colors.primary[400], Colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.webHeaderTop}
      >
        <View style={styles.webHeaderContent}>
          <View>
            <Text style={styles.greeting}>Buenos días, {state.user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.subtitle}>
              Resumen del día · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {getIniciales(state.user?.name ?? 'CM')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tier 2: Options Bar */}
      <View style={styles.webOptionsBar}>
        <View style={styles.webOptionsContent}>
          {tabs.map(t => {
            // Check active state. E.g. /pagos/123 should highlight /pagos.
            const isActive = pathname.startsWith(t.key);
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.webOptionBtn, isActive && styles.webOptionBtnActive]}
                onPress={() => router.push(t.key)}
              >
                <Ionicons name={t.icon as any} size={18} color={isActive ? Colors.primary[600] : Colors.textSecondary} />
                <Text style={[styles.webOptionText, isActive && styles.webOptionTextActive]}>
                  {t.label}
                </Text>
                {!!t.badge && (
                  <View style={styles.webOptionBadge}>
                    <Text style={styles.webOptionBadgeText}>{t.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function TabIcon({
  name,
  color,
  size,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  badge?: number;
}) {
  return (
    <View>
      <Ionicons name={name} size={size} color={color} />
      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  
  // ── Web Navigation Styles ──
  flex: { flex: 1 },
  webNavContainer: {
    width: '100%',
    zIndex: 10,
  },
  webHeaderTop: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  webHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  greeting: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  subtitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.tertiary[500],
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.white },
  
  webOptionsBar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 24,
  },
  webOptionsContent: {
    flexDirection: 'row',
    maxWidth: 1400,
    marginHorizontal: 'auto',
    width: '100%',
  },
  webOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  webOptionBtnActive: {
    borderBottomColor: Colors.primary[600],
  },
  webOptionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  webOptionTextActive: {
    color: Colors.primary[600],
    fontWeight: FontWeight.bold,
  },
  webOptionBadge: {
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  webOptionBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});
