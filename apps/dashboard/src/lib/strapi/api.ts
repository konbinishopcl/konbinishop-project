// API functions for different endpoints
export class StrapiAPI {
  // ========================================
  // HELPER METHODS
  // ========================================

  // Helper function to make requests to the proxy
  private static async makeRequest(
    endpoint: string,
    options: RequestInit & { recaptchaToken?: string } = {}
  ) {
    const { recaptchaToken, ...fetchOptions } = options;

    // Construir headers - manejar FormData vs JSON
    const headers: Record<string, string> = {};

    // Solo agregar Content-Type si no es FormData
    if (!(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Agregar headers del cliente
    if (fetchOptions.headers) {
      Object.entries(fetchOptions.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    // Server-side: read cookie from next/headers to add Authorization
    if (typeof window === 'undefined') {
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get(
          process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt'
        );
        if (tokenCookie) {
          headers['Authorization'] = `Bearer ${tokenCookie.value}`;
        }
      } catch {
        // If we can't access cookies on server-side, continue without token
      }
    }
    // Client-side: do NOT set Authorization header.
    // The browser sends the HttpOnly cookie automatically.
    // The proxy at /api/[...path] reads the cookie and injects Authorization.

    // Add reCAPTCHA token if provided
    if (recaptchaToken) {
      headers['x-recaptcha-token'] = recaptchaToken;
    }

    // Construir URL - absoluta en servidor, relativa en cliente
    const url =
      typeof window !== 'undefined'
        ? `/api/${endpoint}` // Cliente: relativa
        : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/${endpoint}`; // Servidor: absoluta

    const response = await fetch(url, {
      headers,
      credentials: 'include', // ensures HttpOnly cookie is sent with request
      ...fetchOptions,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  // Get count only (without data) for any endpoint
  static async getCount(endpoint: string): Promise<number> {
    try {
      const response = await this.makeRequest(
        `${endpoint}?pagination[pageSize]=0&pagination[withCount]=true`
      );
      return response?.meta?.pagination?.total || 0;
    } catch (error) {
      console.error(`Error getting count for ${endpoint}:`, error);
      return 0;
    }
  }

  // Get dashboard statistics from the stats endpoint
  static async getDashboardStats(): Promise<unknown> {
    try {
      const response = await this.makeRequest('stats');
      return response;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Generic content methods
  static async createContent(endpoint: string, data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateContent(
    endpoint: string,
    documentId: string,
    data: Record<string, unknown>,
    recaptchaToken?: string
  ) {
    const response = await this.makeRequest(`${endpoint}/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // AUTHENTICATION METHODS
  // ========================================

  static async authenticate(
    endpoint: string,
    credentials:
      | Record<string, unknown>
      | { identifier: string; password: string }
      | { email: string }
      | { code: string; password: string; passwordConfirmation: string }
      | {
          currentPassword: string;
          newPassword: string;
          newPasswordConfirmation: string;
        },
    recaptchaToken?: string
  ) {
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(credentials),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // ME METHODS
  // ========================================

  static async getMe() {
    const response = await this.makeRequest('users/me?populate=*');
    return response;
  }

  static async updateMe(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('users/me?populate=*', {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // USER METHODS
  // ========================================

  static async getUsers(): Promise<{ data: unknown[] }> {
    try {
      const response = await this.makeRequest('users');
      return { data: response || [] };
    } catch (error) {
      throw error;
    }
  }

  static async getUser(documentId: string): Promise<unknown> {
    try {
      const response = await this.makeRequest(`users/${documentId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async createUser(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('users', {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateUser(documentId: string, data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest(`users/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // ARTICLE METHODS
  // ========================================

  static async getArticles(
    page: number = 1,
    pageSize: number = 25
  ): Promise<{
    data: unknown[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }> {
    try {
      const response = await this.makeRequest(
        `articles?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=publishedAt:desc,createdAt:desc`
      );
      return (
        response || {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 },
          },
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async createArticle(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('articles', {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateArticle(
    documentId: string,
    data: Record<string, unknown>,
    recaptchaToken?: string
  ) {
    const response = await this.makeRequest(`articles/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // EVENT METHODS
  // ========================================

  static async getEvents(
    page: number = 1,
    pageSize: number = 25
  ): Promise<{
    data: unknown[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }> {
    try {
      const response = await this.makeRequest(
        `events?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`
      );
      return (
        response || {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 },
          },
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async getEvent(documentId: string): Promise<{ data: unknown }> {
    try {
      const response = await this.makeRequest(
        `events/${documentId}?populate=*`
      );
      return response || { data: null };
    } catch (error) {
      throw error;
    }
  }

  static async createEvent(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('events', {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateEvent(documentId: string, data: Record<string, unknown>, recaptchaToken?: string) {
    try {
      const response = await this.makeRequest(`events/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data }),
        recaptchaToken,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ========================================
  // HERO METHODS
  // ========================================

  static async getHeroes(
    page: number = 1,
    pageSize: number = 25
  ): Promise<{
    data: unknown[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }> {
    try {
      const response = await this.makeRequest(
        `heroes?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=date:desc,createdAt:desc`
      );
      return (
        response || {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 },
          },
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async getHero(documentId: string): Promise<{ data: unknown }> {
    try {
      const response = await this.makeRequest(
        `heroes/${documentId}?populate[categories]=*&populate[region]=*&populate[commune]=*&populate[desktop_image]=*&populate[tablet_image]=*&populate[mobile_image]=*&populate[thumbnail]=*`
      );
      return response || { data: null };
    } catch (error) {
      throw error;
    }
  }

  static async createHero(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('heroes', {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateHero(documentId: string, data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest(`heroes/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // SPOT METHODS
  // ========================================

  static async getSpots(
    page: number = 1,
    pageSize: number = 25
  ): Promise<{
    data: unknown[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }> {
    try {
      const response = await this.makeRequest(
        `spots?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=createdAt:desc`
      );
      return (
        response || {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 },
          },
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async getSpot(documentId: string): Promise<{ data: unknown }> {
    try {
      const response = await this.makeRequest(`spots/${documentId}?populate=*`);
      return response || { data: null };
    } catch (error) {
      throw error;
    }
  }

  static async createSpot(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('spots', {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateSpot(documentId: string, data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest(`spots/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // CATEGORY METHODS
  // ========================================

  static async getCategories(
    page: number = 1,
    pageSize: number = 25
  ): Promise<{
    data: unknown[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }> {
    try {
      const response = await this.makeRequest(
        `categories?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=name:asc`
      );
      return (
        response || {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 },
          },
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async getCategory(documentId: string): Promise<unknown> {
    try {
      const response = await this.makeRequest(
        `categories/${documentId}?populate=*`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async createCategory(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('categories', {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateCategory(
    documentId: string,
    data: Record<string, unknown>,
    recaptchaToken?: string
  ) {
    const response = await this.makeRequest(`categories/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // TAG METHODS
  // ========================================

  static async getTags(
    page: number = 1,
    pageSize: number = 25
  ): Promise<{
    data: unknown[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }> {
    try {
      const response = await this.makeRequest(
        `tags?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=name:asc`
      );
      return (
        response || {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 },
          },
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async getTag(documentId: string): Promise<unknown> {
    try {
      const response = await this.makeRequest(`tags/${documentId}?populate=*`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async createTag(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('tags', {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateTag(documentId: string, data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest(`tags/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // REGION METHODS
  // ========================================

  static async getRegions(
    page: number = 1,
    pageSize: number = 25
  ): Promise<{
    data: unknown[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }> {
    try {
      const response = await this.makeRequest(
        `regions?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=name:asc`
      );
      return (
        response || {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 },
          },
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async getRegion(documentId: string): Promise<unknown> {
    try {
      const response = await this.makeRequest(
        `regions/${documentId}?populate=*`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async createRegion(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('regions', {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateRegion(documentId: string, data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest(`regions/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // COMMUNE METHODS
  // ========================================

  static async getCommunes(
    page: number = 1,
    pageSize: number = 25
  ): Promise<{
    data: unknown[];
    meta: {
      pagination: {
        page: number;
        pageSize: number;
        pageCount: number;
        total: number;
      };
    };
  }> {
    try {
      const response = await this.makeRequest(
        `communes?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=name:asc`
      );
      return (
        response || {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 25, pageCount: 1, total: 0 },
          },
        }
      );
    } catch (error) {
      throw error;
    }
  }

  static async getCommune(documentId: string): Promise<unknown> {
    try {
      const response = await this.makeRequest(
        `communes/${documentId}?populate=*`
      );
      // Strapi devuelve la comuna directamente en response.data
      return response;
    } catch (error) {
      throw error;
    }
  }

  static async createCommune(data: Record<string, unknown>, recaptchaToken?: string) {
    const response = await this.makeRequest('communes', {
      method: 'POST',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  static async updateCommune(
    documentId: string,
    data: Record<string, unknown>,
    recaptchaToken?: string
  ) {
    const response = await this.makeRequest(`communes/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
      recaptchaToken,
    });
    return response;
  }

  // ========================================
  // MEDIA/UPLOAD METHODS
  // ========================================

  static async uploadFile(file: File, recaptchaToken?: string) {
    const formData = new FormData();
    formData.append('files', file);

    const response = await this.makeRequest('upload', {
      method: 'POST',
      body: formData,
      recaptchaToken,
    });
    return response;
  }

  static async deleteFile(fileId: number, recaptchaToken?: string) {
    try {
      const response = await this.makeRequest(`upload/files/${fileId}`, {
        method: 'DELETE',
        recaptchaToken,
      });
      return response;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

// Export types
export interface StrapiResponse<T = unknown> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiError {
  error: {
    status: number;
    name: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
