/**
 * AuthService — Autenticación con Supabase Auth.
 * Maneja login, registro, logout, sesiones y perfiles.
 */

import { supabase } from './supabaseClient';
import type { User, UserRole } from '@/src/core/types/auth.types';

export interface RegisterData {
  email: string;
  password: string;
  nombreCompleto: string;
  telefono: string;
}

export const AuthService = {
  /**
   * Iniciar sesión con correo y contraseña.
   * Retorna el User mapeado con datos del perfil.
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { user: null, error: translateAuthError(error.message) };
      }

      if (!data.user) {
        return { user: null, error: 'No se pudo obtener el usuario.' };
      }

      // Fetch profile to get rol
      const profile = await AuthService.getProfile(data.user.id);
      if (!profile) {
        return { user: null, error: 'Perfil no encontrado. Contacta al administrador.' };
      }

      const user: User = {
        id: data.user.id,
        name: profile.nombre_completo || data.user.user_metadata?.nombre_completo || '',
        email: data.user.email ?? '',
        role: (profile.rol as UserRole) || 'usuario',
        telefono: profile.telefono || '',
      };

      return { user, error: null };
    } catch (e: any) {
      console.warn('[AuthService] signIn error:', e);
      return { user: null, error: 'Error de conexión. Verifica tu internet.' };
    }
  },

  /**
   * Registrar una nueva cuenta (solo rol 'usuario').
   */
  async signUp(data: RegisterData): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nombre_completo: data.nombreCompleto,
            rol: 'usuario', // Solo se pueden registrar como usuario/tripulante
            telefono: data.telefono,
          },
        },
      });

      if (error) {
        return { user: null, error: translateAuthError(error.message) };
      }

      if (!authData.user) {
        return { user: null, error: 'No se pudo crear el usuario.' };
      }

      const user: User = {
        id: authData.user.id,
        name: data.nombreCompleto,
        email: authData.user.email ?? '',
        role: 'usuario',
        telefono: data.telefono,
      };

      return { user, error: null };
    } catch (e: any) {
      console.warn('[AuthService] signUp error:', e);
      return { user: null, error: 'Error de conexión. Verifica tu internet.' };
    }
  },

  /**
   * Cerrar sesión.
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[AuthService] signOut error:', e);
    }
  },

  /**
   * Obtener la sesión actual (si existe).
   */
  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (e) {
      console.warn('[AuthService] getSession error:', e);
      return null;
    }
  },

  /**
   * Obtener el perfil de un usuario por su ID.
   */
  async getProfile(userId: string): Promise<{ nombre_completo: string; rol: string; telefono: string } | null> {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('nombre_completo, rol, telefono')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[AuthService] getProfile error:', e);
      return null;
    }
  },

  /**
   * Reconstruir el objeto User a partir de una sesión existente.
   */
  async getUserFromSession(): Promise<User | null> {
    const session = await AuthService.getSession();
    if (!session?.user) return null;

    const profile = await AuthService.getProfile(session.user.id);
    if (!profile) return null;

    return {
      id: session.user.id,
      name: profile.nombre_completo || '',
      email: session.user.email ?? '',
      role: (profile.rol as UserRole) || 'usuario',
      telefono: profile.telefono || '',
    };
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function translateAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed')) return 'Confirma tu correo electrónico antes de iniciar sesión.';
  if (msg.includes('User already registered')) return 'Ya existe una cuenta con este correo.';
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Unable to validate email')) return 'El correo electrónico no es válido.';
  return msg;
}
