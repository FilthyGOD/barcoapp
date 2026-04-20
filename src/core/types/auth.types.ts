/**
 * Tipos de autenticación y usuarios del sistema.
 */

export type UserRole = 'admin' | 'usuario';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: UserRole;
}

/** Usuarios de demostración hardcodeados. En producción, reemplazar con API. */
export const DEMO_USERS: Array<User & { password: string }> = [
  {
    id: 'admin-001',
    name: 'Capitán Morales',
    email: 'admin@barco.mx',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'user-001',
    name: 'Ana Valenzuela',
    email: 'tripulante@barco.mx',
    password: 'user123',
    role: 'usuario',
  },
];
