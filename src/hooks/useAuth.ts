// Hook de autenticação básica (sem Supabase Auth por enquanto, usando localStorage)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('kinu_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((name: string, email?: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
    };
    localStorage.setItem('kinu_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('kinu_user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  const requireAuth = useCallback(() => {
    if (!user && !isLoading) {
      navigate('/');
      return false;
    }
    return true;
  }, [user, isLoading, navigate]);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    requireAuth,
  };
}
