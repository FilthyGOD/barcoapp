/**
 * Pantalla de Registro — Barco Pirata de Puerto Peñasco.
 * Solo permite crear cuentas con rol 'usuario' (Tripulante).
 * Misma estética glassmorphism que el login.
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

const SPLIT_BREAKPOINT = 768;

export default function RegisterScreen() {
  const router = useRouter();
  const { dispatch, registrarBitacora } = useAppStore();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWide = windowWidth >= SPLIT_BREAKPOINT;

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

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
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = 'Ingresa tu nombre completo';
    if (!email.trim()) errs.email = 'Ingresa tu correo electrónico';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Correo electrónico no válido';
    if (!telefono.trim()) errs.telefono = 'Ingresa tu número de teléfono';
    if (!password.trim()) errs.password = 'Ingresa una contraseña';
    else if (password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (password !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) { shake(); return; }

    setLoading(true);

    const { user, error } = await AuthService.signUp({
      email: email.trim().toLowerCase(),
      password,
      nombreCompleto: nombre.trim(),
      telefono: telefono.trim(),
    });

    if (error || !user) {
      setLoading(false);
      shake();
      if (Platform.OS === 'web') {
        window.alert(error ?? 'Error al crear la cuenta');
      } else {
        Alert.alert(
          'Error de Registro',
          error ?? 'No se pudo crear la cuenta. Intenta de nuevo.',
          [{ text: 'Entendido' }],
        );
      }
      return;
    }

    dispatch({ type: 'LOGIN', payload: user });
    setLoading(false);

    router.replace('/(usuario)/dashboard');
  };

  const clearError = (field: string) => {
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  // ── Form Card Content ─────────────────────────────────────────────
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
            <Text style={styles.formTitle}>Crear Cuenta</Text>
            <Text style={styles.formSubtitle}>
              Únete a la tripulación del Barco Pirata
            </Text>
          </View>

          {/* Rol Badge */}
          <View style={styles.rolBadge}>
            <Ionicons name="person" size={16} color={Colors.secondary[400]} />
            <Text style={styles.rolBadgeText}>Tripulante</Text>
          </View>

          <View style={styles.fieldsContainer}>
            <Input
              label="Nombre completo"
              placeholder="Ej. María López"
              value={nombre}
              onChangeText={t => { setNombre(t); clearError('nombre'); }}
              autoCapitalize="words"
              leftIcon="person"
              error={errors.nombre}
            />
            <Input
              label="Correo electrónico"
              placeholder="correo@ejemplo.com"
              value={email}
              onChangeText={t => { setEmail(t); clearError('email'); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail"
              error={errors.email}
            />
            <Input
              label="Teléfono"
              placeholder="(638) 383-0000"
              value={telefono}
              onChangeText={t => { setTelefono(t); clearError('telefono'); }}
              keyboardType="phone-pad"
              leftIcon="call"
              error={errors.telefono}
            />
            <Input
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={t => { setPassword(t); clearError('password'); }}
              isPassword
              leftIcon="lock-closed"
              error={errors.password}
            />
            <Input
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChangeText={t => { setConfirmPassword(t); clearError('confirmPassword'); }}
              isPassword
              leftIcon="lock-closed"
              error={errors.confirmPassword}
            />
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
          >
            <LinearGradient
              colors={[Colors.secondary[400], Colors.secondary[600]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerBtnGradient}
            >
              {loading ? (
                <Text style={styles.registerBtnText}>Creando cuenta...</Text>
              ) : (
                <>
                  <Text style={styles.registerBtnText}>REGISTRARME</Text>
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
            style={styles.loginLink}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.loginLinkText}>Ya tengo cuenta · </Text>
            <Text style={[styles.loginLinkText, styles.loginLinkBold]}>Iniciar Sesión</Text>
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
            <View style={styles.wideOverlay}>
              <View style={styles.wideHeroSide}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <Ionicons name="boat" size={32} color={Colors.white} />
                  </View>
                  <Text style={styles.logoText}>BARCO PIRATA</Text>
                </View>
                <Text style={styles.heroTitle}>
                  ÚNETE A LA{'\n'}TRIPULACIÓN
                </Text>
                <View style={styles.heroDivider} />
                <Text style={styles.heroSubtitle}>
                  Crea tu cuenta y comienza{'\n'}a vivir la aventura.
                </Text>
                <Text style={styles.heroDescription}>
                  Acceso al sistema de reservaciones{'\n'}
                  del Barco Pirata de Puerto Peñasco.
                </Text>
              </View>
              <View style={styles.wideFormSide}>
                {formContent}
              </View>
            </View>
          ) : (
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
                    <Text style={styles.mobileHeroTitle}>Crear Cuenta</Text>
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
    maxWidth: 440,
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
    gap: 16,
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
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 163, 163, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 163, 163, 0.4)',
  },
  rolBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.secondary[300],
  },
  fieldsContainer: {
    gap: 12,
  },
  registerBtn: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  registerBtnDisabled: {
    opacity: 0.6,
  },
  registerBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  registerBtnText: {
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
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: FontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loginLinkBold: {
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 18,
    marginTop: 4,
  },
});
