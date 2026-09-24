import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  async function checkCurrentUser() {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }

  async function loginAdmin(email, password) {
    const res = await api.post('/auth/admin/login', { email, password });
    if (res.data?.user) {
      setUser(res.data.user);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
    }
    return res.data;
  }

  async function loginCandidate(identifier, password) {
    const res = await api.post('/auth/candidate/login', { identifier, password });
    if (res.data?.user) {
      setUser(res.data.user);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
    }
    return res.data;
  }

  async function registerCandidate(data) {
    const res = await api.post('/auth/candidate/register', data);
    if (res.data?.user) {
      setUser(res.data.user);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
    }
    return res.data;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore error
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      disconnectSocket();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'SYSTEM_ADMIN',
        isCandidate: user?.role === 'CANDIDATE',
        loginAdmin,
        loginCandidate,
        registerCandidate,
        logout,
        checkCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
