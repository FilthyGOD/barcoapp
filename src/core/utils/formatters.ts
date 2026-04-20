/**
 * Utilidades de formato para la UI.
 * Moneda MXN, fechas en español, generador de folios.
 */

/** Formatea un número como moneda MXN */
export const formatMXN = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/** Formatea fecha ISO a formato legible en español */
export const formatFecha = (isoDate: string): string => {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** Formatea fecha y hora ISO */
export const formatFechaHora = (isoDatetime: string): string => {
  const date = new Date(isoDatetime);
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Fecha relativa: "Hace 2 horas", "Hace 3 días" */
export const formatRelativo = (isoDatetime: string): string => {
  const diff = Date.now() - new Date(isoDatetime).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 1)   return 'Ahora mismo';
  if (mins < 60)  return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days < 7)   return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return formatFecha(isoDatetime.split('T')[0]);
};

/** Formatea número de tarjeta con espacios cada 4 dígitos */
export const formatTarjeta = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

/** Genera siguiente folio de reservación */
export const generarFolioReservacion = (total: number): string => {
  return `#BP-${String(total + 1).padStart(4, '0')}`;
};

/** Genera siguiente folio de pago */
export const generarFolioPago = (total: number): string => {
  return `#PG-${String(total + 1).padStart(4, '0')}`;
};

/** Genera ID único simple (sin dependencias externas) */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
};

/** Formatea número de teléfono a (638) XXX-XXXX */
export const formatTelefono = (tel: string): string => {
  const digits = tel.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/** Nombre corto de un paquete */
export const nombrePaquete = (paquete: string): string => {
  const map: Record<string, string> = {
    comida: 'Con Comida',
    bebidas: 'Solo Bebidas',
    paseo: 'Solo Paseo',
  };
  return map[paquete] ?? paquete;
};

/** Iniciales de un nombre para avatar */
export const getIniciales = (nombre: string): string => {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map(p => p[0] ?? '')
    .join('')
    .toUpperCase();
};
