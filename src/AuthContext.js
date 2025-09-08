import React, { createContext, useContext, useState, useEffect } from 'react';
import Loading from './components/Loading/Loading';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() =>  {
    const token = localStorage.getItem('token');

    if (token) {
      fetch('http://localhost:5000/api/auth/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      }).then(res => {
          if (!res.ok) {
            throw new Error('Token verification failed');
          }
          return res.json();
        })
        .then(result => {
          if (result.token) {
            const userData = {
              id: result.id_user,
              username: result.username,
              role: result.id_role,
            };
            setUser(userData);
            setToken(result.token);
            localStorage.setItem('token', result.token);
          } else {
            setUser(null);
            localStorage.removeItem('token');
          }
        })
        .catch(error => {
          console.error('Error during token verification:', error);
          setUser(null);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const url = 'http://localhost:5000/api/auth/login';
    const data = { username, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.token) {
        const userData = { username: result.username, role: result.id_role };
        setUser(userData);
        // localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', result.token);
        setToken(result.token);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      // console.error('Error:', error); // This line was commented out to prevent console error for 401
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token }}>
      {loading ? <Loading /> : children}
    </AuthContext.Provider>
  );
}
