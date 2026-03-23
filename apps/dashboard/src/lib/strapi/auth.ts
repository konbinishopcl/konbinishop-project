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
   * Get token from cookie.
   * JWT is stored in an HttpOnly cookie -- not readable from JavaScript.
   * The API proxy reads the cookie server-side and injects Authorization.
   */
  static getToken(): string | null {
    // JWT is stored in an HttpOnly cookie -- not readable from JavaScript.
    // The API proxy reads the cookie server-side and injects Authorization.
    return null;
  }

  /**
   * Clear token cookie by calling the server-side logout route.
   */
  static async clearToken(): Promise<void> {
    if (typeof window === 'undefined') return;
    await fetch('/api/auth/logout', { method: 'POST' });
  }

  /**
   * Login user with email/username and password via server-side route.
   * The JWT is set as an HttpOnly cookie server-side -- not returned to client.
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // JWT is now in an HttpOnly cookie -- not returned to client
      return {
        jwt: '', // JWT is HttpOnly, not accessible from JS
        user: data.user,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed');
    }
  }

  /**
   * Logout user -- calls server route to delete HttpOnly cookie, then redirects.
   */
  static async logout(): Promise<void> {
    await this.clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  static async validateUserRole(): Promise<LoginResponse['user']> {
    const { StrapiAPI } = await import('./api');
    const userData = await StrapiAPI.getMe();

    if (!userData.role || userData.role.type !== 'dashboard') {
      await this.clearToken();
      throw new Error(
        'Acceso denegado. Solo usuarios con rol "Dashboard" pueden acceder al sistema.'
      );
    }

    return userData;
  }
}
