'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Alert from '@/components/Alert';

export default function LoginForm() {
  const { login } = useAuth(); const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      const u = await login(email, password);
      const next = new URLSearchParams(window.location.search).get('next');
      router.push(next && next.startsWith('/') ? next : u.role === 'admin' ? '/admin' : '/account');
    } catch (x) { setErr(x); setBusy(false); }
  };
  return (
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <h1 className="h3 mb-3">Login</h1>
      <form onSubmit={submit} className="card card-body shadow-sm">
        <Alert error={err} />
        <div className="mb-3"><label className="form-label" htmlFor="email">Email</label><input id="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
        <div className="mb-3"><label className="form-label" htmlFor="password">Password</label><input id="password" type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
        <div className="d-flex justify-content-between small mt-3"><Link href="/forgot-password">Forgot password?</Link><Link href="/register">Create an account</Link></div>
      </form>
    </div>
  );
}
