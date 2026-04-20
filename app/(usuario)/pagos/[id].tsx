/**
 * Detalle de pago individual (placeholder).
 */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function PagoDetalleUsuario() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
