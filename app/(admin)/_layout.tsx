/**
 * Layout de navegación — Rol ADMIN.
 * Bottom tabs: Dashboard · Pagos · Reportes · Más (Config + Bitácora)
 */

import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/src/core/store/AppContext';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';

export default function AdminLayout() {
  const { state } = useAppStore();
  const router    = useRouter();
  const { width } = useWindowDimensions();

  // Guard: si no es admin, redirige
  useEffect(() => {
    if (!state.isLoading && (!state.user || state.user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [state.user, state.isLoading]);

  // Conteo de pendientes para badge
  const pendientes = state.reservaciones.filter(r => r.estado === 'pendiente').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
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
      <Tabs.Screen
        name="bitacora"
        options={{
          title: 'Bitácora',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="journal" size={size} color={color} />
          ),
        }}
      />
      {/* Rutas ocultas del tab bar */}
      <Tabs.Screen name="pagos/[id]" options={{ href: null }} />
    </Tabs>
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
});
