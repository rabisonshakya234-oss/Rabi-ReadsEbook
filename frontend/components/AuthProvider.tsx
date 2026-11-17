'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('rr_token');
      const u = localStorage.getItem('rr_user');
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    } catch {}
    setReady(true);
  }, []);

  const save = useCallback((data) => {
    setToken(data.token); setUser(data.user);
    try { localStorage.setItem('rr_token', data.token); localStorage.setItem('rr_user', JSON.stringify(data.user)); } catch {}
  }, []);

  const clear = useCallback(() => {
    setToken(null); setUser(null);
    try { localStorage.removeItem('rr_token'); localStorage.removeItem('rr_user'); } catch {}
  }, []);

  const login = async (email, password) => { const r = await api('/auth/login', { method: 'POST', body: { email, password } }); save(r.data); return r.data.user; };
  const register = async (f) => { const r = await api('/auth/register', { method: 'POST', body: f }); save(r.data); return r.data.user; };
  const logout = async () => { try { await api('/auth/logout', { method: 'POST', token }); } catch {} clear(); };

  // An expired or logged-out token: drop the session.
  const guard = useCallback((e) => { if (e && e.status === 401) clear(); }, [clear]);

  return <Ctx.Provider value={{ user, token, ready, login, register, logout, guard, isAdmin: user?.role === 'admin' }}>{children}</Ctx.Provider>;
}
