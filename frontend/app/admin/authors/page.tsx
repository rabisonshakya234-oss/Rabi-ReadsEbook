'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { imgUrl } from '@/lib/config';
import Alert from '@/components/Alert';

export default function AdminAuthors() {
  const { token } = useAuth();
  const { data, loading, reload } = useLoad(() => api('/authors?limit=100'), []);
  const [f, setF] = useState({ name: '', biography: '' }); const [file, setFile] = useState(null); const [editId, setEditId] = useState(null);
  const [err, setErr] = useState(null); const [ok, setOk] = useState(''); const [key, setKey] = useState(0);
  const reset = () => { setF({ name: '', biography: '' }); setFile(null); setEditId(null); setKey(key + 1); };
  const pick = (e) => {
    const x = e.target.files[0]; if (!x) return setFile(null);
    if (!/\.(jpe?g|png|webp)$/i.test(x.name)) { e.target.value = ''; return setErr(new Error('Image must be .jpg, .jpeg, .png or .webp')); }
    if (x.size > 5 * 1048576) { e.target.value = ''; return setErr(new Error('Image is larger than 5 MB')); }
    setErr(null); setFile(x);
  };
  const save = async (e) => {
    e.preventDefault(); setErr(null); setOk('');
    const fd = new FormData(); fd.append('name', f.name); fd.append('biography', f.biography); if (file) fd.append('profileImage', file);
    try { const r = await api(editId ? `/authors/${editId}` : '/authors', { method: editId ? 'PATCH' : 'POST', form: fd, token }); setOk(r.message); reset(); reload(); } catch (x) { setErr(x); }
  };
  const del = async (a) => { if (!confirm(`Delete author "${a.name}"?`)) return; setErr(null); setOk(''); try { setOk((await api(`/authors/${a._id}`, { method: 'DELETE', token })).message); reload(); } catch (x) { setErr(x); } };
  return (
    <>
      <h1 className="h3 mb-3">Manage Authors</h1>
      <form onSubmit={save} className="card card-body shadow-sm mb-4"><Alert error={err} ok={ok} />
        <div className="row g-2"><div className="col-md-4"><input className="form-control" placeholder="Name *" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={100} /></div>
          <div className="col-md-4"><input key={key} type="file" accept=".jpg,.jpeg,.png,.webp" className="form-control" onChange={pick} /></div>
          <div className="col-md-4 d-flex gap-2"><button className="btn btn-primary">{editId ? 'Update' : 'Add'}</button>{editId && <button type="button" className="btn btn-outline-secondary" onClick={reset}>Cancel</button>}</div>
          <div className="col-12"><textarea className="form-control" rows={3} placeholder="Biography" value={f.biography} onChange={(e) => setF({ ...f, biography: e.target.value })} maxLength={5000} /></div></div></form>
      {loading ? <p className="text-muted">Loading…</p> : <div className="table-responsive"><table className="table bg-white align-middle"><thead><tr><th /><th>Name</th><th>Books</th><th /></tr></thead><tbody>
        {data?.authors.map((a) => <tr key={a._id}><td style={{ width: 60 }}>{imgUrl(a.profileImage) ? <img src={imgUrl(a.profileImage)} alt="" className="avatar" style={{ width: 40, height: 40 }} /> : <div className="avatar" style={{ width: 40, height: 40 }} />}</td><td>{a.name}</td><td>{a.bookCount}</td>
          <td className="text-nowrap"><button className="btn btn-sm btn-outline-primary me-1" onClick={() => { setEditId(a._id); setF({ name: a.name, biography: a.biography || '' }); window.scrollTo(0, 0); }}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => del(a)}>Delete</button></td></tr>)}</tbody></table></div>}
    </>
  );
}
