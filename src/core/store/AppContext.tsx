/**
 * AppContext — Estado centralizado de la aplicación.
 * 
 * ARQUITECTURA: Supabase-First con cache local (AsyncStorage).
 * 
 * Lectura:
 *   1. Intenta cargar de Supabase
 *   2. Si falla (sin internet) → fallback a AsyncStorage cache
 *   3. Si ambos vacíos → usa seed data
 * 
 * Escritura:
 *   1. Actualiza state inmediatamente (UX rápida)
 *   2. Persiste en AsyncStorage (cache local)
 *   3. Sincroniza con Supabase en background (async, no bloquea UI)
 * 
 * Autenticación:
 *   - Usa Supabase Auth (signInWithPassword / signUp)
 *   - Sesiones persistidas con AsyncStorage
 *   - Auto-login si hay sesión activa
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';

import { Reservacion } from '@/src/core/types/reservacion.types';
import { Pago } from '@/src/core/types/pago.types';
import { User } from '@/src/core/types/auth.types';
import { BitacoraEntry, ConfigState, DEFAULT_CONFIG } from '@/src/core/types/bitacora.types';
import { StorageService } from '@/src/core/services/storage.service';
import { SupabaseService } from '@/src/core/services/supabase.service';
import { AuthService } from '@/src/core/services/auth.service';
import { migrarDatosLocalesASupabase } from '@/src/core/services/migrateToSupabase';
import { generateId } from '@/src/core/utils/formatters';
import { supabase } from '@/src/core/services/supabaseClient';
import {
  SEED_RESERVACIONES,
  SEED_PAGOS,
  SEED_BITACORA,
} from '@/src/data/seed';

// ── State ─────────────────────────────────────────────────────────────────────

interface AppState {
  isLoading: boolean;
  user: User | null;
  reservaciones: Reservacion[];
  pagos: Pago[];
  config: ConfigState;
  bitacora: BitacoraEntry[];
  /** Indica si los datos se cargaron de Supabase o del cache local */
  dataSource: 'supabase' | 'local' | 'seed';
}

const initialState: AppState = {
  isLoading: true,
  user: null,
  reservaciones: [],
  pagos: [],
  config: DEFAULT_CONFIG,
  bitacora: [],
  dataSource: 'local',
};

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'HYDRATE'; payload: Partial<AppState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_RESERVACION'; payload: Reservacion }
  | { type: 'UPDATE_RESERVACION'; payload: Reservacion }
  | { type: 'DELETE_RESERVACION'; payload: string }
  | { type: 'ADD_PAGO'; payload: Pago }
  | { type: 'SET_CONFIG'; payload: ConfigState }
  | { type: 'ADD_BITACORA'; payload: BitacoraEntry };

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, isLoading: false };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOGIN':
      return { ...state, user: action.payload };

    case 'LOGOUT':
      return { ...state, user: null };

    case 'ADD_RESERVACION':
      return { ...state, reservaciones: [action.payload, ...state.reservaciones] };

    case 'UPDATE_RESERVACION':
      return {
        ...state,
        reservaciones: state.reservaciones.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };

    case 'DELETE_RESERVACION':
      return {
        ...state,
        reservaciones: state.reservaciones.filter(r => r.id !== action.payload),
      };

    case 'ADD_PAGO':
      return { ...state, pagos: [action.payload, ...state.pagos] };

    case 'SET_CONFIG':
      return { ...state, config: action.payload };

    case 'ADD_BITACORA':
      return { ...state, bitacora: [action.payload, ...state.bitacora] };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  /** Registra una entrada en la bitácora automáticamente */
  registrarBitacora: (
    tipo: BitacoraEntry['tipo'],
    descripcion: string,
    meta?: Record<string, unknown>
  ) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Sync helpers (fire-and-forget, no bloquean UI) ───────────────────────────

function syncToSupabase(action: Action) {
  switch (action.type) {
    case 'ADD_RESERVACION':
      SupabaseService.addReservacion(action.payload).catch(() => {});
      break;
    case 'UPDATE_RESERVACION':
      SupabaseService.updateReservacion(action.payload).catch(() => {});
      break;
    case 'DELETE_RESERVACION':
      SupabaseService.deleteReservacion(action.payload).catch(() => {});
      break;
    case 'ADD_PAGO':
      SupabaseService.addPago(action.payload).catch(() => {});
      break;
    case 'SET_CONFIG':
      SupabaseService.setConfig(action.payload).catch(() => {});
      break;
    case 'ADD_BITACORA':
      SupabaseService.addBitacora(action.payload).catch(() => {});
      break;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);

  // Dispatch wrapper: actualiza state + sincroniza con Supabase
  const dispatch = useCallback((action: Action) => {
    rawDispatch(action);
    syncToSupabase(action);
  }, []);

  // ── Carga inicial: Supabase-First con fallback local ──────────────────────
  useEffect(() => {
    (async () => {
      try {
        // 1. Verificar si hay sesión activa de Supabase Auth
        const user = await AuthService.getUserFromSession();
        if (user) {
          rawDispatch({ type: 'LOGIN', payload: user });
          console.log('[AppContext] ✅ Sesión restaurada:', user.email);
        }

        // 2. Intentar migrar datos locales existentes a Supabase (una sola vez)
        await migrarDatosLocalesASupabase();

        // 3. Intentar cargar de Supabase primero
        const [sbReservaciones, sbPagos, sbConfig, sbBitacora] = await Promise.all([
          SupabaseService.getReservaciones(),
          SupabaseService.getPagos(),
          SupabaseService.getConfig(),
          SupabaseService.getBitacora(),
        ]);

        const supabaseOk = sbReservaciones !== null;

        if (supabaseOk) {
          // ✅ Supabase respondió — usar como fuente de verdad
          const payload = {
            reservaciones: sbReservaciones!,
            pagos: sbPagos ?? [],
            config: sbConfig ?? DEFAULT_CONFIG,
            bitacora: sbBitacora ?? [],
            dataSource: 'supabase' as const,
          };

          // Actualizar cache local con datos frescos de Supabase
          await Promise.all([
            StorageService.setReservaciones(payload.reservaciones),
            StorageService.setPagos(payload.pagos),
            StorageService.setConfig(payload.config),
            StorageService.setBitacora(payload.bitacora),
          ]);

          rawDispatch({ type: 'HYDRATE', payload });
          console.log('[AppContext] ✅ Datos cargados de Supabase');
          return;
        }

        // 4. Supabase no disponible → fallback a cache local
        const seeded = await StorageService.isSeeded();
        if (!seeded) {
          await StorageService.setReservaciones(SEED_RESERVACIONES);
          await StorageService.setPagos(SEED_PAGOS);
          await StorageService.setBitacora(SEED_BITACORA);
          await StorageService.markSeeded();
        }

        const [reservaciones, pagos, config, bitacora] = await Promise.all([
          StorageService.getReservaciones(),
          StorageService.getPagos(),
          StorageService.getConfig(),
          StorageService.getBitacora(),
        ]);

        rawDispatch({
          type: 'HYDRATE',
          payload: {
            reservaciones: (reservaciones as Reservacion[]) ?? SEED_RESERVACIONES,
            pagos:         (pagos as Pago[]) ?? SEED_PAGOS,
            config:        config ?? DEFAULT_CONFIG,
            bitacora:      (bitacora as BitacoraEntry[]) ?? SEED_BITACORA,
            dataSource: 'local' as const,
          },
        });
        console.log('[AppContext] ⚠️ Sin conexión Supabase, usando cache local');
      } catch (e) {
        console.warn('[AppContext] Error en carga inicial:', e);
        rawDispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  // ── Listener de cambios de sesión (logout externo, token expirado) ────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          rawDispatch({ type: 'LOGOUT' });
          console.log('[AppContext] 🔒 Sesión cerrada');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Persistir reservaciones en cache local cuando cambian
  useEffect(() => {
    if (!state.isLoading) {
      StorageService.setReservaciones(state.reservaciones);
    }
  }, [state.reservaciones, state.isLoading]);

  // Persistir pagos en cache local cuando cambian
  useEffect(() => {
    if (!state.isLoading) {
      StorageService.setPagos(state.pagos);
    }
  }, [state.pagos, state.isLoading]);

  // Persistir config en cache local cuando cambia
  useEffect(() => {
    if (!state.isLoading) {
      StorageService.setConfig(state.config);
    }
  }, [state.config, state.isLoading]);

  // Persistir bitácora en cache local cuando cambia
  useEffect(() => {
    if (!state.isLoading) {
      StorageService.setBitacora(state.bitacora);
    }
  }, [state.bitacora, state.isLoading]);

  const registrarBitacora = useCallback(
    (tipo: BitacoraEntry['tipo'], descripcion: string, meta?: Record<string, unknown>) => {
      const entry: BitacoraEntry = {
        id: generateId(),
        tipo,
        descripcion,
        usuario: state.user?.name ?? 'Sistema',
        usuarioId: state.user?.id ?? undefined,
        createdAt: new Date().toISOString(),
        meta,
      };
      dispatch({ type: 'ADD_BITACORA', payload: entry });
    },
    [state.user, dispatch]
  );

  const refreshData = useCallback(async () => {
    rawDispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [sbReservaciones, sbPagos, sbConfig, sbBitacora] = await Promise.all([
        SupabaseService.getReservaciones(),
        SupabaseService.getPagos(),
        SupabaseService.getConfig(),
        SupabaseService.getBitacora(),
      ]);

      if (sbReservaciones !== null) {
        const payload = {
          reservaciones: sbReservaciones,
          pagos: sbPagos ?? [],
          config: sbConfig ?? DEFAULT_CONFIG,
          bitacora: sbBitacora ?? [],
          dataSource: 'supabase' as const,
        };

        await Promise.all([
          StorageService.setReservaciones(payload.reservaciones),
          StorageService.setPagos(payload.pagos),
          StorageService.setConfig(payload.config),
          StorageService.setBitacora(payload.bitacora),
        ]);

        rawDispatch({ type: 'HYDRATE', payload });
      }
    } catch (e) {
      console.warn('[AppContext] Error refrescando datos:', e);
    } finally {
      rawDispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, registrarBitacora, refreshData }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore debe usarse dentro de AppProvider');
  return ctx;
}
