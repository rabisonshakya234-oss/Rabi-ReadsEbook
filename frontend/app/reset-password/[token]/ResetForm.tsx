'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import Alert from '@/components/Alert';

export default function ResetForm({ token }) {
  const [f, setF] = useState({ password: '', confirmPassword: '' });
  const [err, setErr] = useState(null); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(null); setOk('');
    if (f.password !== f.confirmPassword) return setErr(new Error('Passwords do not match'));
    setBusy(true);
    try { setOk((await api(`/auth/reset-password/${encodeURIComponent(token)}`, { method: 'POST', body: f })).message); } catch (x) { setErr(x); }
    setBusy(false);
  };
  return (
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <h1 className="h3 mb-3">Choose a new password</h1>
      <form onSubmit={submit} className="card card-body shadow-sm">
        <Alert error={err} ok={ok} />
        <div className="mb-3"><label className="form-label" htmlFor="p">New password</label><input id="p" type="password" className="form-control" value={f.password} onChange={on('password')} required minLength={8} autoComplete="new-password" /></div>
        <div className="mb-3"><label className="form-label" htmlFor="c">Confirm password</label><input id="c" type="password" className="form-control" value={f.confirmPassword} onChange={on('confirmPassword')} required autoComplete="new-password" /></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
        {ok && <Link href="/login" className="mt-3">Go to login →</Link>}
      </form>
    </div>
  );
}
