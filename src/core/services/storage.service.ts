/**
 * Wrapper de AsyncStorage.
 * Todas las operaciones de persistencia pasan por aquí.
 * En producción, reemplazar fetch() aquí para conectar con API REST.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  RESERVACIONES: '@barco:reservaciones',
  PAGOS:         '@barco:pagos',
  CONFIG:        '@barco:config',
  BITACORA:      '@barco:bitacora',
  AUTH:          '@barco:auth',
  SEEDED:        '@barco:seeded',
} as const;

// ── Genérico ──────────────────────────────────────────────────────────────────

async function getItem<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ── API pública ───────────────────────────────────────────────────────────────

export const StorageService = {
  KEYS,
  getItem,
  setItem,

  async getReservaciones() { return getItem<any[]>(KEYS.RESERVACIONES) ?? []; },
  async setReservaciones(data: any[]) { return setItem(KEYS.RESERVACIONES, data); },

  async getPagos() { return getItem<any[]>(KEYS.PAGOS) ?? []; },
  async setPagos(data: any[]) { return setItem(KEYS.PAGOS, data); },

  async getConfig() { return getItem<any>(KEYS.CONFIG); },
  async setConfig(data: any) { return setItem(KEYS.CONFIG, data); },

  async getBitacora() { return getItem<any[]>(KEYS.BITACORA) ?? []; },
  async setBitacora(data: any[]) { return setItem(KEYS.BITACORA, data); },

  async isSeeded() { return !!(await AsyncStorage.getItem(KEYS.SEEDED)); },
  async markSeeded() { return AsyncStorage.setItem(KEYS.SEEDED, '1'); },

  /** Exporta toda la base de datos como JSON string */
  async exportarTodo(): Promise<string> {
    const [reservaciones, pagos, config, bitacora] = await Promise.all([
      getItem(KEYS.RESERVACIONES),
      getItem(KEYS.PAGOS),
      getItem(KEYS.CONFIG),
      getItem(KEYS.BITACORA),
    ]);
    return JSON.stringify({ reservaciones, pagos, config, bitacora, exportadoAt: new Date().toISOString() }, null, 2);
  },

  /** Limpia todo (útil para desarrollo) */
  async limpiarTodo() {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
