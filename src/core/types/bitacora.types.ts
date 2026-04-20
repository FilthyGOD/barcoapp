/**
 * Bitácora — registro de acciones del sistema.
 */

export type BitacoraTipo =
  | 'RESERVACION_CREADA'
  | 'RESERVACION_EDITADA'
  | 'RESERVACION_ELIMINADA'
  | 'RESERVACION_ACEPTADA'
  | 'RESERVACION_RECHAZADA'
  | 'PAGO_PROCESADO'
  | 'CONFIG_MODIFICADA'
  | 'LOGIN'
  | 'LOGOUT';

export interface BitacoraEntry {
  id: string;
  tipo: BitacoraTipo;
  descripcion: string;
  usuario: string;   // nombre del usuario
  usuarioId: string;
  createdAt: string; // ISO datetime
  meta?: Record<string, unknown>; // datos extra (folio, monto, etc.)
}

export const ETIQUETA_BITACORA: Record<BitacoraTipo, string> = {
  RESERVACION_CREADA:    'Reservación creada',
  RESERVACION_EDITADA:   'Reservación editada',
  RESERVACION_ELIMINADA: 'Reservación eliminada',
  RESERVACION_ACEPTADA:  'Reservación aceptada',
  RESERVACION_RECHAZADA: 'Reservación rechazada',
  PAGO_PROCESADO:        'Pago procesado',
  CONFIG_MODIFICADA:     'Configuración modificada',
  LOGIN:                 'Inicio de sesión',
  LOGOUT:                'Cierre de sesión',
};

export type ConfigState = {
  precios: {
    comida:  number; // default 450
    bebidas: number; // default 350
    paseo:   number; // default 250
  };
  porcentajeDescuento: number;     // default 10
  minPersonasDescuento: number;    // default 5
  nombreNegocio: string;
  telefono: string;
  direccion: string;
};

export const DEFAULT_CONFIG: ConfigState = {
  precios: {
    comida:  450,
    bebidas: 350,
    paseo:   250,
  },
  porcentajeDescuento: 10,
  minPersonasDescuento: 5,
  nombreNegocio: 'Barco Pirata de Puerto Peñasco',
  telefono: '(638) 383-1234',
  direccion: 'Malecón Kino s/n, Puerto Peñasco, Sonora',
};
