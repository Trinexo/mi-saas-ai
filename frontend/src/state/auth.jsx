import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

const initialToken = localStorage.getItem('token') || '';
const initialUser = localStorage.getItem('user');

export function AuthProvider({ children }) {
  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState(initialUser ? JSON.parse(initialUser) : null);

  // Hidratación al arrancar: sincroniza user con el servidor si hay token
  useEffect(() => {
    if (!initialToken) return;
    apiRequest('/auth/me', { token: initialToken })
      .then((res) => {
        if (res) {
          localStorage.setItem('user', JSON.stringify(res));
          setUser(res);
        }
      })
      .catch(() => {
        // Token inválido o expirado — limpiar sesión
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken('');
        setUser(null);
      });
  // Solo al montar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const refreshUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = useMemo(() => ({ token, user, login, logout, refreshUser }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}