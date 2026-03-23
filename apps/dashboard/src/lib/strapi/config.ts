// Strapi configuration
export const STRAPI_CONFIG = {
  // Base URL for Strapi API
  baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',

  // API version
  apiVersion: 'api',

  // Authentication endpoints
  auth: {
    login: '/auth/local',
    register: '/auth/local/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    changePassword: '/auth/change-password',
  },

  // User endpoints
  users: {
    me: '/users/me',
    update: '/users/me',
  },

  // Cookie configuration
  cookies: {
    token: process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt',
    user: process.env.NEXT_PUBLIC_STRAPI_USER_COOKIE || 'strapi_user',
  },
};

// Helper function to build full API URL
export function buildStrapiURL(endpoint: string): string {
  return `${STRAPI_CONFIG.baseURL}/${STRAPI_CONFIG.apiVersion}${endpoint}`;
}

// Helper function to get auth headers
export function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
