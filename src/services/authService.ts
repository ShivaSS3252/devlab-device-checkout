import { User, AuthToken, LoginCredentials, UserRole } from '@/types/auth';

/**
 * MOCK AUTHENTICATION SERVICE
 *
 * This service implements a simplified mock OAuth2 flow for demonstration purposes.
 * In a real application, this would be replaced with actual OAuth2/OIDC providers
 * like Google, GitHub, or Auth0.
 *
 * MOCK VS REAL IMPLEMENTATION DIFFERENCES:
 * - Mock: Uses hardcoded users and simulates OAuth flow
 * - Real: Makes actual HTTP requests to OAuth providers and validates tokens
 * - Mock: Stores tokens in localStorage (insecure for production)
 * - Real: Uses secure HTTP-only cookies or secure token storage
 * - Mock: No actual user verification or security
 * - Real: Cryptographically secure token validation and user authentication
 */

// Mock users for different roles (would be replaced by real user database)
const MOCK_USERS: Record<string, User> = {
  'user1': {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user' as UserRole,
    avatar: 'https://via.placeholder.com/40'
  },
  'user2': {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user' as UserRole,
    avatar: 'https://via.placeholder.com/40'
  },
'admin1': {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@devlab.com',
    role: 'admin' as UserRole,
    avatar: 'https://via.placeholder.com/40'
  }
};

class AuthService {
  private static instance: AuthService;
  private currentToken: AuthToken | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Mock OAuth2 login
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock different users based on provider/code
    let user: User;
    if (credentials.provider === 'google' && credentials.code.includes('admin')) {
      user = MOCK_USERS.admin1;
    } else if (credentials.code.includes('user2')) {
      user = MOCK_USERS.user2;
    } else {
      user = MOCK_USERS.user1;
    }

    const token: AuthToken = {
      accessToken: `mock_token_${user.id}_${Date.now()}`,
      refreshToken: `mock_refresh_${user.id}_${Date.now()}`,
      expiresAt: Date.now() + (3600 * 1000), // 1 hour
      user
    };

    this.currentToken = token;
    this.storeToken(token);

    return token;
  }

  async logout(): Promise<void> {
    this.currentToken = null;
    this.clearStoredToken();
  }

  async refreshToken(): Promise<AuthToken | null> {
    if (!this.currentToken) return null;

    // Simulate token refresh
    await new Promise(resolve => setTimeout(resolve, 500));

    const newToken: AuthToken = {
      ...this.currentToken,
      accessToken: `mock_token_${this.currentToken.user.id}_${Date.now()}`,
      expiresAt: Date.now() + (3600 * 1000)
    };

    this.currentToken = newToken;
    this.storeToken(newToken);

    return newToken;
  }

  getCurrentToken(): AuthToken | null {
    if (this.currentToken && this.isTokenExpired(this.currentToken)) {
      this.clearStoredToken();
      this.currentToken = null;
    }
    return this.currentToken || this.loadStoredToken();
  }

  getCurrentUser(): User | null {
    const token = this.getCurrentToken();
    return token?.user || null;
  }

  isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    return token !== null && !this.isTokenExpired(token);
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  private isTokenExpired(token: AuthToken): boolean {
    return Date.now() >= token.expiresAt;
  }

  private storeToken(token: AuthToken): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', JSON.stringify(token));
    }
  }

  private loadStoredToken(): AuthToken | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem('auth_token');
      if (!stored) return null;

      const token: AuthToken = JSON.parse(stored);
      if (this.isTokenExpired(token)) {
        this.clearStoredToken();
        return null;
      }

      this.currentToken = token;
      return token;
    } catch {
      return null;
    }
  }

  private clearStoredToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
}

export const authService = AuthService.getInstance();
