import { StrapiAPI } from './api';

// Types for authentication
export interface LoginCredentials {
  identifier: string; // email or username
  password: string;
}

export interface LoginResponse {
  jwt: string;
  user: {
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
  };
}

// Authentication functions
export class StrapiAuth {
  /**
   * Get token from cookie
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;

    const cookieName =
      process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt';
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie =>
      cookie.trim().startsWith(`${cookieName}=`)
    );

    return tokenCookie ? tokenCookie.split('=')[1] : null;
  }

  /**
   * Clear token cookie
   */
  static clearToken(): void {
    if (typeof window === 'undefined') return;

    const cookieName =
      process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt';
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  /**
   * Login user with email/username and password
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Use the authentication method that sends data directly
      const response = await StrapiAPI.authenticate('auth/local', credentials);

      // Validate user has dashboard role
      if (!response.user.role || response.user.role.type !== 'dashboard') {
        throw new Error(
          'Acceso denegado. Solo usuarios con rol "Dashboard" pueden acceder al sistema.'
        );
      }

      // Create token cookie
      if (typeof window !== 'undefined') {
        const cookieName =
          process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt';
        document.cookie = `${cookieName}=${response.jwt}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }

      // Get complete user data using getMe
      // const userData = await StrapiAPI.getMe();

      // Return the complete user data instead of just the login response
      return {
        jwt: response.jwt,
        user: response.user,
      };
    } catch (error: unknown) {
      // If it's our custom role validation error, throw it as is
      if (
        error instanceof Error &&
        error.message &&
        error.message.includes('rol "Dashboard"')
      ) {
        throw error;
      }
      // Otherwise, throw the original Strapi error
      if (
        error instanceof Error &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response
      ) {
        const responseData = error.response.data as Record<string, unknown>;
        if (
          responseData.error &&
          typeof responseData.error === 'object' &&
          'message' in responseData.error
        ) {
          throw new Error(responseData.error.message as string);
        }
      }
      throw new Error('Login failed');
    }
  }

  /**
   * Logout user
   */
  static logout(): void {
    this.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  static async validateUserRole(): Promise<LoginResponse['user']> {
    const userData = await StrapiAPI.getMe();

    if (!userData.role || userData.role.type !== 'dashboard') {
      this.clearToken();
      throw new Error(
        'Acceso denegado. Solo usuarios con rol "Dashboard" pueden acceder al sistema.'
      );
    }

    return userData;
  }
}
