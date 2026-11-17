'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import Alert from '@/components/Alert';

export default function AdminCategories() {
  const { token } = useAuth();
  const { data, loading, reload } = useLoad(() => api('/categories?limit=100'), []);
  const [f, setF] = useState({ name: '', description: '' }); const [editId, setEditId] = useState(null); const [err, setErr] = useState(null); const [ok, setOk] = useState('');
  const reset = () => { setF({ name: '', description: '' }); setEditId(null); };
  const save = async (e) => {
    e.preventDefault(); setErr(null); setOk('');
    try { const r = await api(editId ? `/categories/${editId}` : '/categories', { method: editId ? 'PATCH' : 'POST', body: f, token }); setOk(r.message); reset(); reload(); } catch (x) { setErr(x); }
  };
  const del = async (c) => { if (!confirm(`Delete category "${c.name}"?`)) return; setErr(null); setOk(''); try { setOk((await api(`/categories/${c._id}`, { method: 'DELETE', token })).message); reload(); } catch (x) { setErr(x); } };
  return (
    <>
      <h1 className="h3 mb-3">Manage Categories</h1>
      <form onSubmit={save} className="card card-body shadow-sm mb-4"><Alert error={err} ok={ok} />
        <div className="row g-2"><div className="col-md-4"><input className="form-control" placeholder="Name *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={60} /></div>
          <div className="col-md-5"><input className="form-control" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={500} /></div>
          <div className="col-md-3 d-flex gap-2"><button className="btn btn-primary">{editId ? 'Update' : 'Add'}</button>{editId && <button type="button" className="btn btn-outline-secondary" onClick={reset}>Cancel</button>}</div></div></form>
      {loading ? <p className="text-muted">Loading…</p> : <div className="table-responsive"><table className="table bg-white align-middle"><thead><tr><th>Name</th><th>Description</th><th>Books</th><th /></tr></thead><tbody>
        {data?.categories.map((c) => <tr key={c._id}><td>{c.name}</td><td>{c.description}</td><td>{c.bookCount}</td><td className="text-nowrap"><button className="btn btn-sm btn-outline-primary me-1" onClick={() => { setEditId(c._id); setF({ name: c.name, description: c.description || '' }); window.scrollTo(0, 0); }}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => del(c)}>Delete</button></td></tr>)}</tbody></table></div>}
    </>
  );
}
