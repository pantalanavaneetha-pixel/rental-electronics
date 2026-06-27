/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email,
      password
    });

    const { token: jwtToken, user: userData } = response.data;

    setIsAuthenticated(true);
    setToken(jwtToken);
    setUser(userData);

    localStorage.setItem('rentshield_cc_authed', 'true');
    localStorage.setItem('rentshield_cc_token', jwtToken);
    localStorage.setItem('rentshield_cc_user', JSON.stringify(userData));
    localStorage.setItem('rentshield_cc_role', userData.role);

    return userData;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    localStorage.removeItem('rentshield_cc_authed');
    localStorage.removeItem('rentshield_cc_token');
    localStorage.removeItem('rentshield_cc_user');
    localStorage.removeItem('rentshield_cc_role');
  };

  // Initialize authentication from localStorage
  useEffect(() => {
    const storedAuth = localStorage.getItem('rentshield_cc_authed') === 'true';
    const storedToken = localStorage.getItem('rentshield_cc_token');
    const storedUser = localStorage.getItem('rentshield_cc_user');

    if (storedAuth && storedToken && storedUser) {
      setIsAuthenticated(true);
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Clear corrupt state
        logout();
      }
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
