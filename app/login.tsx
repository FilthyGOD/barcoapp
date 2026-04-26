/**
 * Pantalla de Login — Barco Pirata de Puerto Peñasco.
 * Diseño moderno con fondo completo y card de cristal líquido.
 * Acceso con roles: Capitán (Admin) / Tripulante (Usuario).
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '@/src/core/store/AppContext';
import { Colors } from '@/src/core/theme/colors';
import { BorderRadius, Shadow } from '@/src/core/theme/spacing';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { DEMO_USERS, UserRole } from '@/src/core/types/auth.types';
import { Input } from '@/src/shared/components/ui/Input';

const BG_IMAGE = require('@/assets/images/login-bs.jpg');

// Breakpoint for split-screen vs stacked layout
const SPLIT_BREAKPOINT = 768;

export default function LoginScreen() {
  const router = useRouter();
  const { dispatch, registrarBitacora } = useAppStore();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWide = windowWidth >= SPLIT_BREAKPOINT;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('usuario');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    if (!email.trim()) errs.email = 'Ingresa tu correo electrónico';
    if (!password.trim()) errs.password = 'Ingresa tu contraseña';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) { shake(); return; }

    setLoading(true);
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

  // ── Common Form Card Content ──────────────────────────────────────
  const formContent = (
    <Animated.View
      style={[
        styles.formCard,
        isWide && styles.formCardWide,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.formScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Bienvenido</Text>
          <Text style={styles.formSubtitle}>Ingresa tus datos para acceder al sistema</Text>
        </View>

        <View style={styles.rolSection}>
          <Text style={styles.sectionLabel}>Ingresar como</Text>
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

        <View style={styles.fieldsContainer}>
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
        </View>

        <TouchableOpacity style={styles.forgotWrap}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
        >
          <LinearGradient
            colors={[Colors.primary[400], Colors.primary[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginBtnGradient}
          >
            {loading ? (
              <Text style={styles.loginBtnText}>Verificando...</Text>
            ) : (
              <>
                <Text style={styles.loginBtnText}>INICIAR SESIÓN</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 8 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.demoBox}>
          <View style={styles.demoHeader}>
            <Ionicons name="key" size={16} color={Colors.white} />
            <Text style={styles.demoTitle}>Credenciales de demo</Text>
          </View>
          <View style={styles.demoCredentials}>
            <View style={styles.demoRow}>
              <Text style={styles.demoBadge}>Capitán</Text>
              <Text style={styles.demoValue}>admin@barco.mx · admin123</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={[styles.demoBadge, styles.demoBadgeUser]}>Tripulante</Text>
              <Text style={styles.demoValue}>tripulante@barco.mx · user123</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          © 2025 Barco Pirata de Puerto Peñasco{'\n'}Todos los derechos reservados
        </Text>
      </ScrollView>
    </Animated.View>
  );

  return (
    <View style={styles.flex}>
      <ImageBackground
        source={BG_IMAGE}
        style={[styles.absolute, { width: windowWidth, height: windowHeight }]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,65,106,0.4)', 'rgba(0,26,48,0.7)']}
          style={styles.absolute}
        >
          {isWide ? (
            // Layout de Escritorio
            <View style={styles.wideOverlay}>
              <View style={styles.wideHeroSide}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <Ionicons name="boat" size={32} color={Colors.white} />
                  </View>
                  <Text style={styles.logoText}>BARCO PIRATA</Text>
                </View>
                <Text style={styles.heroTitle}>
                  EXPLORA{'\n'}PUERTO PEÑASCO
                </Text>
                <View style={styles.heroDivider} />
                <Text style={styles.heroSubtitle}>
                  Donde Tus Aventuras en el{'\n'}Mar Se Hacen Realidad.
                </Text>
                <Text style={styles.heroDescription}>
                  Sistema de reservaciones para experiencias{'\n'}
                  inolvidables en el Mar de Cortés.
                </Text>
              </View>
              <View style={styles.wideFormSide}>
                {formContent}
              </View>
            </View>
          ) : (
            // Layout Móvil
            <SafeAreaView style={styles.flex}>
              <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <ScrollView
                  contentContainerStyle={styles.mobileScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.mobileHero}>
                    <View style={styles.logoContainer}>
                      <View style={styles.logoCircle}>
                        <Ionicons name="boat" size={28} color={Colors.white} />
                      </View>
                      <Text style={styles.logoText}>BARCO PIRATA</Text>
                    </View>
                    <Text style={styles.mobileHeroTitle}>Sistema de Reservaciones</Text>
                  </View>
                  {formContent}
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          )}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

// ── RolCard Component ────────────────────────────────────────────────────────

function RolCard({ icon, title, subtitle, selected, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.rolCard, selected && styles.rolCardSelected]}
    >
      <View style={[styles.rolIconWrap, selected && styles.rolIconWrapSelected]}>
        <Ionicons
          name={icon}
          size={20}
          color={selected ? Colors.white : 'rgba(255,255,255,0.6)'}
        />
      </View>
      <View>
        <Text style={[styles.rolTitle, selected && styles.rolTitleSelected]}>{title}</Text>
        <Text style={[styles.rolSub, selected && styles.rolSubSelected]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  absolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  // Escritorio
  wideOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '8%',
  },
  wideHeroSide: {
    flex: 1,
    paddingRight: 40,
  },
  wideFormSide: {
    width: 440,
    alignItems: 'center',
  },

  // Hero Content
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(197,160,89,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 3,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    lineHeight: 54,
    letterSpacing: 1,
  },
  heroDivider: {
    width: 60,
    height: 3,
    backgroundColor: Colors.tertiary[500],
    marginVertical: 24,
    borderRadius: 2,
  },
  heroSubtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: FontWeight.medium,
    lineHeight: 28,
    marginBottom: 16,
  },
  heroDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
  },

  // Móvil
  mobileScroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mobileHero: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  mobileHeroTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    fontWeight: FontWeight.medium,
    letterSpacing: 1,
  },

  // Card de Cristal
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
    ...Shadow.lg,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(30px) saturate(160%)',
      WebkitBackdropFilter: 'blur(30px) saturate(160%)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    } as any : {}),
  },
  formCardWide: {
    maxWidth: 420,
  },
  formScroll: {
    gap: 18,
  },
  formHeader: {
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  formSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  rolRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rolCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  rolCardSelected: {
    borderColor: Colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  rolIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rolIconWrapSelected: {
    backgroundColor: Colors.primary[500],
  },
  rolTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  rolTitleSelected: {
    color: Colors.white,
  },
  rolSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
  rolSubSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fieldsContainer: {
    gap: 14,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: FontWeight.medium,
  },
  loginBtn: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  loginBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 1.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontSize: FontSize.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: FontWeight.medium,
  },
  demoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  demoTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  demoCredentials: {
    gap: 8,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  demoBadge: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 0.3,
  },
  demoBadgeUser: {
    backgroundColor: Colors.secondary[500],
  },
  demoValue: {
    fontSize: FontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: FontWeight.medium,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 18,
    marginTop: 4,
  },
});
