import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  documentId: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  rut: string;
  is_company: boolean;
  firstname: string;
  lastname: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  role: {
    id: number;
    documentId: string;
    name: string;
    description: string;
    type: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string | null;
  };
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  hasDashboardRole: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,

      setUser: (user: User) => {
        if (!user.role || user.role.type !== 'dashboard') {
          throw new Error('Usuario no tiene permisos de dashboard');
        }
        set({
          user,
          isAuthenticated: true,
        });
      },

      clearUser: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
        // Clear localStorage manually to ensure complete cleanup
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-storage');
        }
      },

      hasDashboardRole: () => {
        return useUserStore.getState().user?.role?.type === 'dashboard';
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
