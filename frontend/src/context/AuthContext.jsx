import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      try {
        setUser(savedUser ? JSON.parse(savedUser) : null);
      } catch {
        setUser(null);
      }
      setToken(savedToken || null);
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  const saveAuth = (authData) => {
    localStorage.setItem('token', authData.token);
    const userInfo = {
      email: authData.email,
      fullName: authData.fullName,
      role: authData.role,
      emailVerified: authData.emailVerified,
    };
    localStorage.setItem('user', JSON.stringify(userInfo));
    setToken(authData.token);
    setUser(userInfo);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      saveAuth(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { fullName, email, password });
      // Note: We deliberately do NOT call saveAuth(res.data) here.
      // The user must verify OTP before they are considered fully authenticated.
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      saveAuth(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (email) => {
    return await api.post('/auth/resend-otp', { email });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
