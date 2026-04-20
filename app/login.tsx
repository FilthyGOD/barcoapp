/**
 * Pantalla de Login — Barco Pirata de Puerto Peñasco.
 * Acceso con roles: Capitán (Admin) / Tripulante (Usuario).
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppStore } from '@/src/core/store/AppContext';
import { DEMO_USERS, UserRole } from '@/src/core/types/auth.types';
import { Input } from '@/src/shared/components/ui/Input';
import { Button } from '@/src/shared/components/ui/Button';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Shadow, Spacing } from '@/src/core/theme/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const { dispatch, registrarBitacora } = useAppStore();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<UserRole>('usuario');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});

  // Animación de shake para error
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.trim())    errs.email    = 'Ingresa tu correo electrónico';
    if (!password.trim()) errs.password = 'Ingresa tu contraseña';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) { shake(); return; }

    setLoading(true);
    // Simula latencia de red
    await new Promise(r => setTimeout(r, 800));

    const user = DEMO_USERS.find(
      u => u.email === email.trim().toLowerCase()
           && u.password === password
           && u.role === role,
    );

    if (!user) {
      setLoading(false);
      shake();
      Alert.alert(
        'Acceso denegado',
        'Correo, contraseña o rol incorrecto. Verifica tus datos.',
        [{ text: 'Entendido' }],
      );
      return;
    }

    const { password: _, ...safeUser } = user;
    dispatch({ type: 'LOGIN', payload: safeUser });
    registrarBitacora('LOGIN', `Inicio de sesión — ${safeUser.name}`);
    setLoading(false);

    router.replace(role === 'admin' ? '/(admin)/dashboard' : '/(usuario)/dashboard');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Hero superior ────────────────────────────── */}
          <LinearGradient
            colors={[Colors.primary[500], Colors.primary[700]]}
            style={styles.hero}
          >
            {/* Decoración de olas */}
            <View style={styles.waveRow}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={[styles.wave, { opacity: 0.08 + i * 0.02 }]} />
              ))}
            </View>

            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <Ionicons name="boat" size={44} color={Colors.primary[500]} />
              </View>
            </View>

            <Text style={styles.heroTitle}>Barco Pirata</Text>
            <Text style={styles.heroSub}>Puerto Peñasco, Sonora</Text>
            <Text style={styles.heroTagline}>Sistema de Reservaciones</Text>
          </LinearGradient>

          {/* ── Formulario ───────────────────────────────── */}
          <Animated.View style={[styles.form, { transform: [{ translateX: shakeAnim }] }]}>

            {/* Selector de rol */}
            <View style={styles.rolSection}>
              <Text style={styles.rolLabel}>Ingresar como:</Text>
              <View style={styles.rolRow}>
                <RolCard
                  icon="shield-checkmark"
                  title="Capitán"
                  subtitle="Administrador"
                  selected={role === 'admin'}
                  onPress={() => setRole('admin')}
                />
                <RolCard
                  icon="person"
                  title="Tripulante"
                  subtitle="Usuario"
                  selected={role === 'usuario'}
                  onPress={() => setRole('usuario')}
                />
              </View>
            </View>

            {/* Campos */}
            <Input
              label="Correo electrónico"
              placeholder="correo@barco.mx"
              value={email}
              onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail"
              error={errors.email}
            />
            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
              isPassword
              leftIcon="lock-closed"
              error={errors.password}
            />

            {/* Credenciales de demo */}
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>👨‍✈️ Credenciales de demo</Text>
              <Text style={styles.demoLine}>
                <Text style={styles.demoBold}>Capitán (Admin): </Text>
                admin@barco.mx · admin123
              </Text>
              <Text style={styles.demoLine}>
                <Text style={styles.demoBold}>Tripulante: </Text>
                tripulante@barco.mx · user123
              </Text>
            </View>

            <Button
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.loginBtn}
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </Button>

            <Text style={styles.footer}>
              © 2025 Barco Pirata de Puerto Peñasco · Todos los derechos reservados
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── RolCard ────────────────────────────────────────────────────────────────────

function RolCard({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.rolCard, selected && styles.rolCardSelected]}
    >
      <View style={[styles.rolIconWrap, selected && styles.rolIconWrapSelected]}>
        <Ionicons
          name={icon}
          size={22}
          color={selected ? Colors.white : Colors.textMuted}
        />
      </View>
      <Text style={[styles.rolTitle, selected && styles.rolTitleSelected]}>{title}</Text>
      <Text style={[styles.rolSub, selected && styles.rolSubSelected]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.background },
  flex:  { flex: 1 },
  scroll: { flexGrow: 1 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: Spacing[8],
    paddingBottom: Spacing[10],
    overflow: 'hidden',
    position: 'relative',
  },
  waveRow: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    gap: 6,
  },
  wave: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    marginBottom: -30,
  },
  logoWrap: { marginBottom: Spacing[3] },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.tertiary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.lg,
  },
  heroTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    marginTop: Spacing[2],
    letterSpacing: 0.5,
  },
  heroSub: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  heroTagline: {
    fontSize: FontSize.sm,
    color: Colors.tertiary[300],
    marginTop: 6,
    fontWeight: FontWeight.medium,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Formulario
  form: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -Spacing[5],
    padding: Spacing[5],
    gap: Spacing[4],
    flex: 1,
    ...Shadow.lg,
  },

  // Rol
  rolSection: { gap: Spacing[2] },
  rolLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rolRow: { flexDirection: 'row', gap: Spacing[3] },
  rolCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing[1],
    padding: Spacing[3],
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.neutral[50],
  },
  rolCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  rolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rolIconWrapSelected: { backgroundColor: Colors.primary[500] },
  rolTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },
  rolTitleSelected: { color: Colors.primary[500] },
  rolSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  rolSubSelected: { color: Colors.primary[400] },

  // Demo box
  demoBox: {
    backgroundColor: Colors.secondary[50],
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary[500],
    gap: 4,
  },
  demoTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary[700],
    marginBottom: 2,
  },
  demoLine: { fontSize: FontSize.xs, color: Colors.textSecondary },
  demoBold: { fontWeight: FontWeight.bold },

  loginBtn: { marginTop: Spacing[2] },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing[2],
  },
});
