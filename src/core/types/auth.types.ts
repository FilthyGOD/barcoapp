/**
 * Tipos de autenticación y usuarios del sistema.
 */

export type UserRole = 'admin' | 'usuario';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  telefono?: string;
  avatar?: string;
  isGuest?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
