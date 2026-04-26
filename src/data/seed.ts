/**
 * Datos de prueba — Puerto Peñasco, Sonora.
 * 20 reservaciones con clientes y datos reales de la zona.
 * Se cargan al primer arranque de la app si AsyncStorage está vacío.
 */

import { Reservacion } from '@/src/core/types/reservacion.types';
import { Pago } from '@/src/core/types/pago.types';
import { BitacoraEntry } from '@/src/core/types/bitacora.types';

const hoy = new Date();
const fmtFecha = (offset: number) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() - offset);
  return d.toISOString().split('T')[0];
};

export const SEED_RESERVACIONES: Reservacion[] = [];

export const SEED_PAGOS: Pago[] = [];

export const SEED_BITACORA: BitacoraEntry[] = [];
