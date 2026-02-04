import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  login: (email: string, password: string) => void;
  loginWithGoogle: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email, password) => {
        if (email && password) {
          set({ isAuthenticated: true, user: { email, name: email.split('@')[0] } });
        }
      },
      loginWithGoogle: () => {
        set({ isAuthenticated: true, user: { email: 'user@gmail.com', name: 'Viajante' } });
      },
      logout: () => {
        set({ isAuthenticated: false, user: null });
      }
    }),
    { name: 'kinu-auth' }
  )
);
