'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import Alert from '@/components/Alert';

export default function ForgotForm() {
  const [email, setEmail] = useState(''); const [err, setErr] = useState(null); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(null); setOk(''); setBusy(true);
    try { setOk((await api('/auth/forgot-password', { method: 'POST', body: { email } })).message); } catch (x) { setErr(x); }
    setBusy(false);
  };
  return (
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <h1 className="h3 mb-3">Forgot password</h1>
      <form onSubmit={submit} className="card card-body shadow-sm">
        <Alert error={err} ok={ok} />
        <div className="mb-3"><label className="form-label" htmlFor="e">Your email</label><input id="e" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
      </form>
    </div>
  );
}
