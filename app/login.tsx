/**
 * Pantalla de Login — Barco Pirata de Puerto Peñasco.
 * Diseño moderno con fondo completo y card de cristal líquido.
 * Autenticación con Supabase Auth (signInWithPassword).
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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
import { AuthService } from '@/src/core/services/auth.service';
import { Colors } from '@/src/core/theme/colors';
import { BorderRadius, Shadow } from '@/src/core/theme/spacing';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
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

    const { user, error } = await AuthService.signIn(
      email.trim().toLowerCase(),
      password,
    );

    if (error || !user) {
      setLoading(false);
      shake();
      if (Platform.OS === 'web') {
        window.alert(error ?? 'Error de autenticación');
      } else {
        Alert.alert(
          'Acceso denegado',
          error ?? 'Correo o contraseña incorrectos.',
          [{ text: 'Entendido' }],
        );
      }
      return;
    }

    dispatch({ type: 'LOGIN', payload: user });
    if (user.role === 'admin') {
      registrarBitacora('LOGIN', `Inicio de sesión — ${user.name}`);
    }
    setLoading(false);

    router.replace(user.role === 'admin' ? '/(admin)/dashboard' : '/(usuario)/dashboard');
  };

  const handleGuestLogin = () => {
    dispatch({
      type: 'LOGIN',
      payload: {
        id: 'guest',
        name: 'Invitado',
        email: '',
        role: 'usuario',
        isGuest: true,
      },
    });
    router.replace('/(usuario)/dashboard');
  };

  // ── Common Form Card Content ──────────────────────────────────────
  const formContent = (
    <Animated.View
      style={[
        styles.formCardContainer,
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
      <BlurView intensity={Platform.OS === 'ios' ? 40 : 80} tint="dark" style={styles.formCard}>
        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Bienvenido</Text>
          <Text style={styles.formSubtitle}>Ingresa tus datos para acceder al sistema</Text>
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

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push('/register')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add" size={18} color={Colors.white} />
          <Text style={styles.registerBtnText}>CREAR CUENTA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerBtn, { marginTop: 12, backgroundColor: 'transparent', borderColor: 'rgba(255, 255, 255, 0.2)' }]}
          onPress={handleGuestLogin}
          activeOpacity={0.85}
        >
          <Ionicons name="compass-outline" size={18} color={Colors.white} />
          <Text style={styles.registerBtnText}>EXPLORAR SIN CUENTA</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          © 2025 Barco Pirata de Puerto Peñasco{'\n'}Todos los derechos reservados
        </Text>
      </ScrollView>
      </BlurView>
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
  formCardContainer: {
    width: '100%',
    borderRadius: 24,
    ...Shadow.lg,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    } as any : {}),
  },
  formCardWide: {
    maxWidth: 420,
  },
  formCard: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(60, 45, 10, 0.4)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(30px) saturate(160%)',
      WebkitBackdropFilter: 'blur(30px) saturate(160%)',
    } as any : {}),
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
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  registerBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 1,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 18,
    marginTop: 4,
  },
});
