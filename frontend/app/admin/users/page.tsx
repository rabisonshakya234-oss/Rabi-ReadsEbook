'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import Alert from '@/components/Alert';

export default function AdminUsers() {
  const { token, user: me } = useAuth();
  const [page, setPage] = useState(1); const [err, setErr] = useState(null);
  const { data, loading, error, reload } = useLoad(() => api(`/users?page=${page}&limit=20`, { token }), [token, page]);
  const setRole = async (u, role) => { setErr(null); try { await api(`/users/${u._id}`, { method: 'PATCH', body: { role }, token }); reload(); } catch (x) { setErr(x); } };
  const del = async (u) => { if (!confirm(`Delete user "${u.username}"?`)) return; setErr(null); try { await api(`/users/${u._id}`, { method: 'DELETE', token }); reload(); } catch (x) { setErr(x); } };
  const pg = data?.data?.pagination;
  return (
    <>
      <h1 className="h3 mb-3">Manage Users</h1><Alert error={err || error} />
      {loading ? <p className="text-muted">Loading…</p> : <div className="table-responsive"><table className="table bg-white align-middle"><thead><tr><th>Username</th><th>Email</th><th>Role</th><th /></tr></thead><tbody>
        {data?.data.users.map((u) => <tr key={u._id}><td>{u.username}</td><td>{u.email}</td><td><span className={'badge ' + (u.role === 'admin' ? 'text-bg-primary' : 'text-bg-secondary')}>{u.role}</span></td>
          <td className="text-nowrap">{u._id !== me._id && <><button className="btn btn-sm btn-outline-primary me-1" onClick={() => setRole(u, u.role === 'admin' ? 'user' : 'admin')}>Make {u.role === 'admin' ? 'user' : 'admin'}</button><button className="btn btn-sm btn-outline-danger" onClick={() => del(u)}>Delete</button></>}</td></tr>)}</tbody></table></div>}
      {pg && pg.totalPages > 1 && <div className="d-flex justify-content-center gap-2 align-items-center"><button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="small">Page {pg.page} of {pg.totalPages}</span><button className="btn btn-sm btn-outline-secondary" disabled={page >= pg.totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </>
  );
}
