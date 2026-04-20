/**
 * index.tsx — Redirige según el estado de autenticación.
 */

import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppStore } from '@/src/core/store/AppContext';
import { Colors } from '@/src/core/theme/colors';

export default function Index() {
  const { state } = useAppStore();

  if (state.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!state.user) return <Redirect href="/login" />;
  if (state.user.role === 'admin')   return <Redirect href="/(admin)/dashboard" />;
  return <Redirect href="/(usuario)/dashboard" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});
