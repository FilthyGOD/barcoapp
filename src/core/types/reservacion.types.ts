/**
 * Tipos para el módulo de Reservaciones.
 * Preparado para futura conexión con API REST / base de datos real.
 */

export type PaqueteTipo = 'comida' | 'bebidas' | 'paseo';
export type ServicioTipo = 'individual' | 'grupal';
export type EstadoReservacion = 'pendiente' | 'pagado' | 'aceptada' | 'rechazada';
export type HorarioPaseo = '10:00' | '14:00' | '17:30';

export interface Reservacion {
  id: string;
  folio: string;             // '#BP-XXXX'
  fechaPaseo: string;        // 'YYYY-MM-DD'
  horaPaseo: HorarioPaseo;
  numPersonas: number;
  tipoServicio: ServicioTipo;
  paquete: PaqueteTipo;
  clienteNombre: string;
  clienteTelefono: string;
  subtotal: number;
  descuento: number;         // monto en pesos (no porcentaje)
  total: number;
  estado: EstadoReservacion;
  notaAdmin?: string;        // Nota del admin al aceptar/rechazar
  creadoPor: string;         // userId del tripulante
  createdAt: string;         // ISO datetime
  updatedAt: string;
}

export interface ReservacionFormData {
  fechaPaseo: string;
  horaPaseo: HorarioPaseo;
  numPersonas: number;
  tipoServicio: ServicioTipo;
  paquete: PaqueteTipo;
  clienteNombre: string;
  clienteTelefono: string;
}

export const ETIQUETA_PAQUETE: Record<PaqueteTipo, string> = {
  comida:  'Con Comida',
  bebidas: 'Solo Bebidas',
  paseo:   'Solo Paseo',
};

export const ETIQUETA_ESTADO: Record<EstadoReservacion, string> = {
  pendiente: 'Pendiente',
  pagado:    'Pagado',
  aceptada:  'Aceptada',
  rechazada: 'Rechazada',
};

export const ETIQUETA_HORARIO: Record<HorarioPaseo, string> = {
  '10:00': '10:00 AM',
  '14:00':  '2:00 PM',
  '17:30':  '5:30 PM',
};
