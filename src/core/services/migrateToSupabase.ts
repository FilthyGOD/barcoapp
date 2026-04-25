/**
 * migrateToSupabase — Migra datos locales de AsyncStorage a Supabase.
 * Se ejecuta UNA sola vez. Si los datos ya están en Supabase, no hace nada.
 * Útil para usuarios que ya tenían datos locales antes de la migración.
 */

import { StorageService } from './storage.service';
import { SupabaseService } from './supabase.service';
import { Reservacion } from '@/src/core/types/reservacion.types';
import { Pago } from '@/src/core/types/pago.types';
import { BitacoraEntry, ConfigState } from '@/src/core/types/bitacora.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MIGRATED_KEY = '@barco:migrated_to_supabase';

export async function migrarDatosLocalesASupabase(): Promise<void> {
  try {
    // Check if already migrated
    const migrated = await AsyncStorage.getItem(MIGRATED_KEY);
    if (migrated) return;

    // Check if Supabase already has data
    const existentes = await SupabaseService.getReservaciones();
    if (existentes && existentes.length > 0) {
      // Supabase already has data (e.g. seed), mark as migrated
      await AsyncStorage.setItem(MIGRATED_KEY, new Date().toISOString());
      return;
    }

    // Load local data
    const [reservaciones, pagos, config, bitacora] = await Promise.all([
      StorageService.getReservaciones(),
      StorageService.getPagos(),
      StorageService.getConfig() as Promise<ConfigState | null>,
      StorageService.getBitacora(),
    ]);

    // Upload reservaciones one by one (upsert-safe)
    if (Array.isArray(reservaciones)) {
      for (const r of reservaciones as Reservacion[]) {
        await SupabaseService.addReservacion(r);
      }
    }

    // Upload pagos
    if (Array.isArray(pagos)) {
      for (const p of pagos as Pago[]) {
        await SupabaseService.addPago(p);
      }
    }

    // Upload bitacora
    if (Array.isArray(bitacora)) {
      for (const b of bitacora as BitacoraEntry[]) {
        await SupabaseService.addBitacora(b);
      }
    }

    // Upload config
    if (config) {
      await SupabaseService.setConfig(config);
    }

    await AsyncStorage.setItem(MIGRATED_KEY, new Date().toISOString());
    console.log('[Migration] Datos locales migrados a Supabase exitosamente');
  } catch (e) {
    console.warn('[Migration] Error al migrar datos locales:', e);
    // Don't mark as migrated so it retries next time
  }
}
