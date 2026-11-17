'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import Alert from '@/components/Alert';

export default function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' });
  const [err, setErr] = useState(null); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(null); setOk(''); setBusy(true);
    try { const r = await api('/contact', { method: 'POST', body: f }); setOk(r.message || 'Thank you! Your message was sent.'); setF({ name: '', email: '', subject: '', message: '' }); }
    catch (x) { setErr(x); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="card card-body shadow-sm">
      <Alert error={err} ok={ok} />
      <div className="mb-3"><label className="form-label" htmlFor="name">Name</label><input id="name" className="form-control" value={f.name} onChange={on('name')} required maxLength={100} /></div>
      <div className="mb-3"><label className="form-label" htmlFor="email">Email</label><input id="email" type="email" className="form-control" value={f.email} onChange={on('email')} required maxLength={150} /></div>
      <div className="mb-3"><label className="form-label" htmlFor="subject">Subject (optional)</label><input id="subject" className="form-control" value={f.subject} onChange={on('subject')} maxLength={150} /></div>
      <div className="mb-3"><label className="form-label" htmlFor="message">Message</label><textarea id="message" className="form-control" rows={5} value={f.message} onChange={on('message')} required minLength={10} maxLength={3000} /></div>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
