/**
 * Lógica de negocio para Reservaciones.
 * Separada de la UI para facilitar migración a API REST.
 */

import { Reservacion, ReservacionFormData } from '@/src/core/types/reservacion.types';
import { ConfigState } from '@/src/core/types/bitacora.types';
import { generarFolioReservacion, generateId } from '@/src/core/utils/formatters';

/** Calcula subtotal, descuento, impuesto y total de una reservación */
export const calcularTotales = (
  numPersonas: number,
  paquete: 'comida' | 'bebidas' | 'paseo',
  config: ConfigState,
): { subtotal: number; descuento: number; impuesto: number; total: number } => {
  const precio = config.precios[paquete];
  const subtotal = precio * numPersonas;
  const aplicaDescuento = numPersonas >= config.minPersonasDescuento;
  const descuento = aplicaDescuento
    ? Math.round(subtotal * (config.porcentajeDescuento / 100))
    : 0;
  const impuesto = subtotal * 0.1;
  const total = subtotal - descuento + impuesto;
  return { subtotal, descuento, impuesto, total };
};

/** Crea una nueva reservación con todos sus campos calculados */
export const crearReservacion = (
  formData: ReservacionFormData,
  config: ConfigState,
  userId: string,
  totalExistentes: number,
): Reservacion => {
  const { subtotal, descuento, impuesto, total } = calcularTotales(
    formData.numPersonas,
    formData.paquete,
    config,
  );
  const ahora = new Date().toISOString();
  return {
    id: generateId(),
    folio: generarFolioReservacion(totalExistentes),
    ...formData,
    subtotal,
    descuento,
    total,
    estado: 'pendiente',
    creadoPor: userId,
    createdAt: ahora,
    updatedAt: ahora,
  };
};

/** Actualiza una reservación existente recalculando los totales */
export const actualizarReservacion = (
  original: Reservacion,
  formData: ReservacionFormData,
  config: ConfigState,
): Reservacion => {
  const { subtotal, descuento, impuesto, total } = calcularTotales(
    formData.numPersonas,
    formData.paquete,
    config,
  );
  return {
    ...original,
    ...formData,
    subtotal,
    descuento,
    total,
    updatedAt: new Date().toISOString(),
  };
};

/** Filtra reservaciones por fecha y estado */
export const filtrarReservaciones = (
  reservaciones: Reservacion[],
  filtro: {
    desde?: string;
    hasta?: string;
    estado?: string;
    busqueda?: string;
  },
): Reservacion[] => {
  return reservaciones.filter(r => {
    if (filtro.estado && filtro.estado !== 'todos' && r.estado !== filtro.estado) return false;
    if (filtro.desde && r.fechaPaseo < filtro.desde) return false;
    if (filtro.hasta && r.fechaPaseo > filtro.hasta) return false;
    if (filtro.busqueda) {
      const q = filtro.busqueda.toLowerCase();
      return (
        r.folio.toLowerCase().includes(q) ||
        r.clienteNombre.toLowerCase().includes(q) ||
        r.clienteTelefono.includes(q)
      );
    }
    return true;
  });
};

/** Obtiene las reservaciones del día actual */
export const reservacionesDeHoy = (reservaciones: Reservacion[]): Reservacion[] => {
  const hoy = new Date().toISOString().split('T')[0];
  return reservaciones.filter(r => r.fechaPaseo === hoy);
};

/** Calcula ingresos del día (solo pagadas) */
export const ingresosDeHoy = (reservaciones: Reservacion[]): number => {
  return reservacionesDeHoy(reservaciones)
    .filter(r => r.estado === 'pagado')
    .reduce((sum, r) => sum + r.total, 0);
};

/** Agrupa reservaciones por mes para gráfica de tendencia */
export const tendenciaMensual = (
  reservaciones: Reservacion[],
  meses = 6,
): Array<{ mes: string; ingresos: number }> => {
  const result: Array<{ mes: string; ingresos: number }> = [];
  const ahora = new Date();

  for (let i = meses - 1; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const nombreMes = fecha.toLocaleDateString('es-MX', { month: 'short' });

    const ingresos = reservaciones
      .filter(r => r.fechaPaseo.startsWith(clave) && r.estado === 'pagado')
      .reduce((sum, r) => sum + r.total, 0);

    result.push({ mes: nombreMes, ingresos });
  }
  return result;
};
