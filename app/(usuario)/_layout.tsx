/**
 * Layout de navegación — Rol USUARIO (Tripulante).
 * Bottom tabs: Dashboard · Reservaciones · Pagos
 */

import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/src/core/store/AppContext';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';

export default function UsuarioLayout() {
  const { state } = useAppStore();
  const router    = useRouter();

  // Guard: si no es usuario, redirige
  useEffect(() => {
    if (!state.isLoading && (!state.user || state.user.role !== 'usuario')) {
      router.replace('/login');
    }
  }, [state.user, state.isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
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
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservaciones/index"
        options={{
          title: 'Reservaciones',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
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
      {/* Rutas ocultas del tab bar */}
      <Tabs.Screen name="reservaciones/nueva"  options={{ href: null }} />
      <Tabs.Screen name="reservaciones/[id]"   options={{ href: null }} />
      <Tabs.Screen name="pagos/[id]"           options={{ href: null }} />
    </Tabs>
  );
}
