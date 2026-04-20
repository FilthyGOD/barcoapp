/**
 * Detalle de pago individual (placeholder para navegación futura).
 * La lógica principal está en pagos/index.tsx con el modal.
 */
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function PagoDetalle() {
  const router = useRouter();
  useEffect(() => { router.back(); }, []);
  return null;
}
