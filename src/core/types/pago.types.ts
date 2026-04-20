/**
 * Tipos para el módulo de Pagos.
 */

export type MetodoPago = 'efectivo' | 'tarjeta';
export type TipoCuenta = 'debito' | 'credito' | 'visa' | 'mastercard' | 'amex';

export interface Pago {
  id: string;
  folioPago: string;          // '#PG-XXXX'
  reservacionId: string;
  metodoPago: MetodoPago;
  monto: number;
  ultimos4?: string;          // últimos 4 dígitos si es tarjeta
  tipoCuenta?: TipoCuenta;
  procesadoPor: string;       // userId
  procesadoAt: string;        // ISO datetime
}

export interface PagoFormData {
  metodoPago: MetodoPago;
  numeroTarjeta?: string;
  tipoCuenta?: TipoCuenta;
  fechaExpiracion?: string;
  cvv?: string;
}

export const ETIQUETA_METODO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  tarjeta:  'Tarjeta',
};

export const ETIQUETA_CUENTA: Record<TipoCuenta, string> = {
  debito:     'Débito',
  credito:    'Crédito',
  visa:       'Visa',
  mastercard: 'Mastercard',
  amex:       'American Express',
};
