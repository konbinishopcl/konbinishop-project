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
        // Validate that user has dashboard role before setting
        // if (user.role && user.role.name === 'Dashboard') {
        //   // Clear any existing user data first to ensure clean state
        //   if (typeof window !== 'undefined') {
        //     localStorage.removeItem('user-storage');
        //   }

        //   set({
        //     user,
        //     isAuthenticated: true,
        //   });
        // } else {
        //   throw new Error('Usuario no tiene permisos de dashboard');
        // }

        // Allow any user to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-storage');
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
        // return user?.role?.name === 'Dashboard';
        return true; // Allow any user to access dashboard
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
