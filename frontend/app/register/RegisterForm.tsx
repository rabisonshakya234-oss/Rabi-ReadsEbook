'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Alert from '@/components/Alert';

export default function RegisterForm() {
  const { register } = useAuth(); const router = useRouter();
  const [f, setF] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(null);
    if (f.password !== f.confirmPassword) return setErr(new Error('Passwords do not match'));
    setBusy(true);
    try { await register(f); router.push('/account'); } catch (x) { setErr(x); setBusy(false); }
  };
  return (
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <h1 className="h3 mb-3">Create an account</h1>
      <form onSubmit={submit} className="card card-body shadow-sm">
        <Alert error={err} />
        <div className="mb-3"><label className="form-label" htmlFor="u">Username</label><input id="u" className="form-control" value={f.username} onChange={on('username')} required minLength={3} maxLength={30} pattern="[a-zA-Z0-9_.\-]{3,30}" title="3-30 characters: letters, numbers, _ . -" autoComplete="username" /></div>
        <div className="mb-3"><label className="form-label" htmlFor="e">Email</label><input id="e" type="email" className="form-control" value={f.email} onChange={on('email')} required autoComplete="email" /></div>
        <div className="mb-3"><label className="form-label" htmlFor="p">Password</label><input id="p" type="password" className="form-control" value={f.password} onChange={on('password')} required minLength={8} autoComplete="new-password" /><div className="form-text">At least 8 characters, with a letter and a number.</div></div>
        <div className="mb-3"><label className="form-label" htmlFor="c">Confirm password</label><input id="c" type="password" className="form-control" value={f.confirmPassword} onChange={on('confirmPassword')} required autoComplete="new-password" /></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
        <div className="small mt-3">Already have an account? <Link href="/login">Login</Link></div>
      </form>
    </div>
  );
}
