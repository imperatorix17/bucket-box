import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Config hardcoded - edit these values to change credentials
const config = {
  auth: {
    username: "admin",
    password: "admin123"
  }
};

const SESSION_DURATION_DAYS = 4; // Session lasts 4 days

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedExpiry = localStorage.getItem('cloudvault_auth_expiry');
    if (storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      if (Date.now() < expiryTime) {
        setIsAuthenticated(true);
      } else {
        // Session expired, clean up
        localStorage.removeItem('cloudvault_auth_expiry');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === config.auth.username && password === config.auth.password) {
      setIsAuthenticated(true);
      const expiryTime = Date.now() + (SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
      localStorage.setItem('cloudvault_auth_expiry', expiryTime.toString());
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cloudvault_auth_expiry');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
