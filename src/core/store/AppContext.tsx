/**
 * AppContext — Estado centralizado de la aplicación.
 * Usa Context API + useReducer. Persistido en AsyncStorage.
 * Preparado para migrar a Zustand o Redux en producción.
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
import { generateId } from '@/src/core/utils/formatters';
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
}

const initialState: AppState = {
  isLoading: true,
  user: null,
  reservaciones: [],
  pagos: [],
  config: DEFAULT_CONFIG,
  bitacora: [],
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
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Carga inicial desde AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        // Sembrar datos de prueba si es primer arranque
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

        dispatch({
          type: 'HYDRATE',
          payload: {
            reservaciones: (reservaciones as Reservacion[]) ?? SEED_RESERVACIONES,
            pagos:         (pagos as Pago[]) ?? SEED_PAGOS,
            config:        config ?? DEFAULT_CONFIG,
            bitacora:      (bitacora as BitacoraEntry[]) ?? SEED_BITACORA,
          },
        });
      } catch (e) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  // Persistir reservaciones cuando cambian
  useEffect(() => {
    if (!state.isLoading) {
      StorageService.setReservaciones(state.reservaciones);
    }
  }, [state.reservaciones, state.isLoading]);

  // Persistir pagos cuando cambian
  useEffect(() => {
    if (!state.isLoading) {
      StorageService.setPagos(state.pagos);
    }
  }, [state.pagos, state.isLoading]);

  // Persistir config cuando cambia
  useEffect(() => {
    if (!state.isLoading) {
      StorageService.setConfig(state.config);
    }
  }, [state.config, state.isLoading]);

  // Persistir bitácora cuando cambia
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
        usuarioId: state.user?.id ?? 'system',
        createdAt: new Date().toISOString(),
        meta,
      };
      dispatch({ type: 'ADD_BITACORA', payload: entry });
    },
    [state.user]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, registrarBitacora }}>
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
