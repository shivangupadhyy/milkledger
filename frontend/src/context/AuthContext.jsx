import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize: check if user is already logged in
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('milkledger_token');
      if (token) {
        try {
          const profile = await apiClient('/auth/profile');
          setUser(profile);
        } catch (err) {
          console.error('Failed to load profile on init:', err.message);
          localStorage.removeItem('milkledger_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await apiClient('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      localStorage.setItem('milkledger_token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password, businessName) => {
    setError(null);
    try {
      const data = await apiClient('/auth/register', {
        method: 'POST',
        body: { name, email, password, businessName }
      });
      localStorage.setItem('milkledger_token', data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const forgotPassword = async (email, businessName, newPassword) => {
    setError(null);
    try {
      const data = await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: { email, businessName, newPassword }
      });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('milkledger_token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const updated = await apiClient('/auth/profile', {
        method: 'PUT',
        body: profileData
      });
      setUser(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    setError(null);
    try {
      const response = await apiClient('/auth/change-password', {
        method: 'PUT',
        body: { oldPassword, newPassword }
      });
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    forgotPassword,
    logout,
    updateProfile,
    changePassword,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
