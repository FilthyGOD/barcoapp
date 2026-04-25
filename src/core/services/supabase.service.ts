/**
 * SupabaseService — CRUD operations against Supabase tables.
 * Maps camelCase (TypeScript) ↔ snake_case (Postgres) automatically.
 * Every method returns null on failure so the caller can fallback to local cache.
 */

import { supabase } from './supabaseClient';
import { Reservacion } from '@/src/core/types/reservacion.types';
import { Pago } from '@/src/core/types/pago.types';
import { BitacoraEntry } from '@/src/core/types/bitacora.types';
import { ConfigState, DEFAULT_CONFIG } from '@/src/core/types/bitacora.types';

// ── Mappers: camelCase ↔ snake_case ──────────────────────────────────────────

function reservacionToRow(r: Reservacion): Record<string, unknown> {
  return {
    id: r.id,
    folio: r.folio,
    fecha_paseo: r.fechaPaseo,
    hora_paseo: r.horaPaseo,
    num_personas: r.numPersonas,
    tipo_servicio: r.tipoServicio,
    paquete: r.paquete,
    cliente_nombre: r.clienteNombre,
    cliente_telefono: r.clienteTelefono,
    subtotal: r.subtotal,
    descuento: r.descuento,
    total: r.total,
    estado: r.estado,
    nota_admin: r.notaAdmin ?? null,
    creado_por: r.creadoPor,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

function rowToReservacion(row: Record<string, any>): Reservacion {
  return {
    id: row.id,
    folio: row.folio,
    fechaPaseo: row.fecha_paseo,
    horaPaseo: row.hora_paseo,
    numPersonas: row.num_personas,
    tipoServicio: row.tipo_servicio,
    paquete: row.paquete,
    clienteNombre: row.cliente_nombre,
    clienteTelefono: row.cliente_telefono,
    subtotal: Number(row.subtotal),
    descuento: Number(row.descuento),
    total: Number(row.total),
    estado: row.estado,
    notaAdmin: row.nota_admin ?? undefined,
    creadoPor: row.creado_por,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function pagoToRow(p: Pago): Record<string, unknown> {
  return {
    id: p.id,
    folio_pago: p.folioPago,
    reservacion_id: p.reservacionId,
    metodo_pago: p.metodoPago,
    monto: p.monto,
    ultimos4: p.ultimos4 ?? null,
    tipo_cuenta: p.tipoCuenta ?? null,
    procesado_por: p.procesadoPor,
    procesado_at: p.procesadoAt,
  };
}

function rowToPago(row: Record<string, any>): Pago {
  return {
    id: row.id,
    folioPago: row.folio_pago,
    reservacionId: row.reservacion_id,
    metodoPago: row.metodo_pago,
    monto: Number(row.monto),
    ultimos4: row.ultimos4 ?? undefined,
    tipoCuenta: row.tipo_cuenta ?? undefined,
    procesadoPor: row.procesado_por,
    procesadoAt: row.procesado_at,
  };
}

function bitacoraToRow(b: BitacoraEntry): Record<string, unknown> {
  return {
    id: b.id,
    tipo: b.tipo,
    descripcion: b.descripcion,
    usuario: b.usuario,
    usuario_id: b.usuarioId,
    created_at: b.createdAt,
    meta: b.meta ?? null,
  };
}

function rowToBitacora(row: Record<string, any>): BitacoraEntry {
  return {
    id: row.id,
    tipo: row.tipo,
    descripcion: row.descripcion,
    usuario: row.usuario,
    usuarioId: row.usuario_id,
    createdAt: row.created_at,
    meta: row.meta ?? undefined,
  };
}

// ── Service ──────────────────────────────────────────────────────────────────

export const SupabaseService = {
  // ── Reservaciones ──────────────────────────────────────────────────────────

  async getReservaciones(): Promise<Reservacion[] | null> {
    try {
      const { data, error } = await supabase
        .from('reservaciones')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToReservacion);
    } catch (e) {
      console.warn('[Supabase] Error fetching reservaciones:', e);
      return null;
    }
  },

  async addReservacion(r: Reservacion): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservaciones')
        .insert(reservacionToRow(r));
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Error adding reservacion:', e);
      return false;
    }
  },

  async updateReservacion(r: Reservacion): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservaciones')
        .update(reservacionToRow(r))
        .eq('id', r.id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Error updating reservacion:', e);
      return false;
    }
  },

  async deleteReservacion(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservaciones')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Error deleting reservacion:', e);
      return false;
    }
  },

  // ── Pagos ──────────────────────────────────────────────────────────────────

  async getPagos(): Promise<Pago[] | null> {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .order('procesado_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToPago);
    } catch (e) {
      console.warn('[Supabase] Error fetching pagos:', e);
      return null;
    }
  },

  async addPago(p: Pago): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pagos')
        .insert(pagoToRow(p));
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Error adding pago:', e);
      return false;
    }
  },

  // ── Bitácora ───────────────────────────────────────────────────────────────

  async getBitacora(): Promise<BitacoraEntry[] | null> {
    try {
      const { data, error } = await supabase
        .from('bitacora')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToBitacora);
    } catch (e) {
      console.warn('[Supabase] Error fetching bitacora:', e);
      return null;
    }
  },

  async addBitacora(b: BitacoraEntry): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bitacora')
        .insert(bitacoraToRow(b));
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Error adding bitacora:', e);
      return false;
    }
  },

  // ── Configuración ──────────────────────────────────────────────────────────

  async getConfig(): Promise<ConfigState | null> {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('datos')
        .eq('id', 'default')
        .single();
      if (error) throw error;
      return (data?.datos as ConfigState) ?? null;
    } catch (e) {
      console.warn('[Supabase] Error fetching config:', e);
      return null;
    }
  },

  async setConfig(config: ConfigState): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('configuracion')
        .upsert({
          id: 'default',
          datos: config,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[Supabase] Error saving config:', e);
      return false;
    }
  },
};
