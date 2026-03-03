import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { CONFIG } from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Configure Axios default header
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('token', token);
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('token');
        }
    }, [token]);

    // Check if token is valid on load
    useEffect(() => {
        const initAuth = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get(`${CONFIG.API_URL}/auth/me`);
                setUser(res.data);
            } catch (err) {
                console.error("Auth check failed:", err);
                logout();
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []); // Run once on mount

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${CONFIG.API_URL}/auth/login`, { email, password });
            setToken(res.data.token);
            setUser(res.data.user);
            return true;
        } catch (err) {
            console.error("Login failed:", err);
            throw err;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
