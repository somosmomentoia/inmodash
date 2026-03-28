/**
 * Authentication hook for client-side auth state management
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import config from '@/config/env';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  companyName?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<boolean>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const router = useRouter();

  // Clear error
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Check authentication status - STRICT: must validate with backend
  const checkAuth = useCallback(async () => {
    console.log('🔍 Checking authentication...');
    
    // Helper to clear auth and set not authenticated
    const clearAuth = (reason: string) => {
      console.log(`❌ ${reason}`);
      localStorage.removeItem('auth-token');
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    };
    
    // Get token from localStorage
    const storedToken = localStorage.getItem('auth-token');
    
    // If no token at all, not authenticated
    if (!storedToken) {
      clearAuth('No token found');
      return;
    }

    // Check if token is expired locally first
    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp <= now) {
        clearAuth('Token expired locally');
        return;
      }
    } catch (e) {
      clearAuth('Invalid token format');
      return;
    }

    // Token exists and not expired locally - verify with backend
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      console.log('🔄 Verifying token with backend...');
      const response = await fetch(`${config.apiUrl}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${storedToken}`
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log('📡 Backend response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.user) {
          console.log('✅ Authenticated:', data.user.email);
          setAuthState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
          return;
        }
      }
      
      // Backend rejected the token - clear everything
      clearAuth(`Backend rejected token, status: ${response.status}`);
      
    } catch (error: any) {
      console.error('❌ Auth check error:', error);
      clearAuth('Network error during auth check');
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Clear any existing tokens first
    localStorage.removeItem('auth-token');
    console.log('🗑️ Cleared old tokens before login');
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    // Try Owner login first
    try {
      console.log('🔐 Trying Owner login...');
      const ownerResponse = await fetch(`${config.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const ownerData = await ownerResponse.json();

      if (ownerResponse.ok && ownerData.success && ownerData.user) {
        console.log('✅ Owner login successful:', ownerData.user.email);
        
        if (ownerData.accessToken) {
          localStorage.setItem('auth-token', ownerData.accessToken);
          console.log('� Token saved to localStorage');
        }
        
        setAuthState({
          user: ownerData.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return true;
      }
      
      // If Owner login failed, try Staff login
      console.log('🔐 Owner login failed, trying Staff login...');
      const staffResponse = await fetch(`${config.apiUrl}/api/staff/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const staffData = await staffResponse.json();

      if (staffResponse.ok && staffData.success && staffData.user) {
        console.log('✅ Staff login successful:', staffData.user.email);
        
        if (staffData.token) {
          localStorage.setItem('auth-token', staffData.token);
          console.log('💾 Staff token saved to localStorage');
        }
        
        // Save staff permissions to localStorage
        if (staffData.permissions) {
          localStorage.setItem('user-permissions', JSON.stringify(staffData.permissions));
          console.log('💾 Staff permissions saved:', staffData.permissions.length);
        }
        
        setAuthState({
          user: staffData.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return true;
      }

      // Both failed
      console.log('❌ Both Owner and Staff login failed');
      localStorage.removeItem('auth-token');
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: staffData.error || staffData.message || 'Credenciales inválidas',
      }));
      return false;
      
    } catch (error) {
      console.error('❌ Login network error:', error);
      localStorage.removeItem('auth-token');
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error de conexión. Por favor intenta de nuevo.',
      }));
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      await fetch(`${config.apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage token, permissions and cookies
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user-permissions');
      console.log('🗑️ Cleared localStorage token and permissions');
      
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      router.push('/');
    }
  }, [router]);

  // Register function
  const register = useCallback(async (
    userData: any
  ): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiUrl = config.apiUrl;
      console.log('🔥 REGISTRATION ATTEMPT - API URL:', apiUrl);
      console.log('🔥 FULL REGISTRATION URL:', `${apiUrl}/api/auth/register`);
      console.log('🔥 REGISTRATION DATA:', userData);
      console.log('🔥 TIMESTAMP:', new Date().toISOString());
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        const text = await response.text();
        console.log('Response text:', text);
        throw new Error('Invalid JSON response from server');
      }

      if (response.ok) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: data.message || 'Registration failed',
        }));
        return false;
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error. Please try again.',
      }));
      return false;
    }
  }, []);

  // Refresh auth state
  const refreshAuth = useCallback(async (): Promise<void> => {
    await checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check auth on mount only once
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    refreshAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Hook for protected routes
export function useRequireAuth(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading, user, refreshAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🛡️ useRequireAuth check:', { isLoading, isAuthenticated });
    
    if (!isLoading && !isAuthenticated) {
      console.log('🚫 Not authenticated, redirecting to:', redirectTo);
      // Clear any stale tokens before redirecting
      localStorage.removeItem('auth-token');
      // Use window.location for more reliable redirect
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Listen for auth errors from API calls (e.g., 401 responses)
  useEffect(() => {
    const handleAuthError = () => {
      console.log('🔒 Auth error detected, redirecting to login');
      localStorage.removeItem('auth-token');
      router.replace(redirectTo);
    };

    // Custom event for auth errors
    window.addEventListener('auth:error', handleAuthError);
    
    return () => {
      window.removeEventListener('auth:error', handleAuthError);
    };
  }, [router, redirectTo]);

  // Periodically check auth status (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInterval = setInterval(() => {
      refreshAuth();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(checkInterval);
  }, [isAuthenticated, refreshAuth]);

  return {
    isAuthenticated,
    isLoading,
    user,
    isReady: !isLoading && isAuthenticated,
  };
}

// Hook for guest routes (redirect if authenticated)
export function useRequireGuest(redirectTo: string = '/dashboard') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return {
    isAuthenticated,
    isLoading,
    isReady: !isLoading && !isAuthenticated,
  };
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/login'
) {
  return function AuthenticatedComponent(props: P) {
    const { isReady, user } = useRequireAuth(redirectTo);

    if (!isReady) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Higher-order component for guest routes
export function withGuest<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = '/dashboard'
) {
  return function GuestComponent(props: P) {
    const { isReady } = useRequireGuest(redirectTo);

    if (!isReady) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
