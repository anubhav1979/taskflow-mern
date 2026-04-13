import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('taskflow_token');
    if (token) {
      API.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          setOrganization(res.data.organization);
        })
        .catch(() => {
          localStorage.removeItem('taskflow_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData, orgData) => {
    localStorage.setItem('taskflow_token', token);
    setUser(userData);
    setOrganization(orgData);
  };

  const logout = () => {
    localStorage.removeItem('taskflow_token');
    setUser(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider value={{ user, organization, setOrganization, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);