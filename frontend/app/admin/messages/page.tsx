'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { fmtDate } from '@/lib/config';
import Alert from '@/components/Alert';

export default function AdminMessages() {
  const { token } = useAuth();
  const [page, setPage] = useState(1); const [open, setOpen] = useState(null); const [err, setErr] = useState(null);
  const { data, loading, error, reload } = useLoad(() => api(`/contact?page=${page}&limit=20`, { token }), [token, page]);
  const mark = async (m, isRead) => { setErr(null); try { await api(`/contact/${m._id}`, { method: 'PATCH', body: { isRead }, token }); reload(); } catch (x) { setErr(x); } };
  const del = async (m) => { if (!confirm('Delete this message?')) return; setErr(null); try { await api(`/contact/${m._id}`, { method: 'DELETE', token }); setOpen(null); reload(); } catch (x) { setErr(x); } };
  const toggle = (m) => { setOpen(open === m._id ? null : m._id); if (!m.isRead) mark(m, true); };
  return (
    <>
      <h1 className="h3 mb-3">Messages {data && data.unread > 0 && <span className="badge text-bg-danger">{data.unread} unread</span>}</h1><Alert error={err || error} />
      {loading ? <p className="text-muted">Loading…</p> : <div className="list-group">
        {data?.messages.map((m) => <div key={m._id} className="list-group-item">
          <div className="d-flex justify-content-between gap-2" role="button" onClick={() => toggle(m)}><div><strong className={m.isRead ? 'fw-normal' : ''}>{m.subject || '(no subject)'}</strong> <span className="text-muted small">– {m.name} &lt;{m.email}&gt;</span></div><span className="small text-muted">{fmtDate(m.createdAt)}</span></div>
          {open === m._id && <div className="mt-2"><p className="prose">{m.message}</p><button className="btn btn-sm btn-outline-secondary me-1" onClick={() => mark(m, !m.isRead)}>Mark {m.isRead ? 'unread' : 'read'}</button><a className="btn btn-sm btn-outline-primary me-1" href={`mailto:${m.email}`}>Reply</a><button className="btn btn-sm btn-outline-danger" onClick={() => del(m)}>Delete</button></div>}
        </div>)}
        {data?.messages.length === 0 && <div className="list-group-item text-muted">No messages.</div>}</div>}
      {data && data.pages > 1 && <div className="d-flex justify-content-center gap-2 align-items-center mt-3"><button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="small">Page {data.page} of {data.pages}</span><button className="btn btn-sm btn-outline-secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </>
  );
}
