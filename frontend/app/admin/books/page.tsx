'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api, qs } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import Alert from '@/components/Alert';

export default function AdminBooks() {
  const { token, guard } = useAuth();
  const [page, setPage] = useState(1); const [q, setQ] = useState(''); const [term, setTerm] = useState(''); const [err, setErr] = useState(null);
  const { data, error, loading, reload } = useLoad(() => api(`/books${qs({ page, limit: 20, search: term })}`, { token }), [token, page, term]);
  useEffect(() => { guard(error); }, [error, guard]);
  const del = async (b) => {
    if (!confirm(`Delete "${b.name}" and its files? This cannot be undone.`)) return;
    setErr(null); try { await api(`/books/${b._id}`, { method: 'DELETE', token }); reload(); } catch (x) { setErr(x); }
  };
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-3"><h1 className="h3 mb-0">Manage Books</h1><Link href="/admin/books/new" className="btn btn-primary">+ Add book</Link></div>
      <form className="d-flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); setPage(1); setTerm(q); }}><input className="form-control" placeholder="Search books" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn btn-outline-primary">Search</button></form>
      <Alert error={err || error} />
      {loading ? <p className="text-muted">Loading…</p> : <div className="table-responsive"><table className="table table-hover bg-white align-middle"><thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Files</th><th>Downloads</th><th>Status</th><th /></tr></thead><tbody>
        {data?.books.map((b) => <tr key={b._id}><td><Link href={`/books/${b.slug}`} target="_blank">{b.name}</Link></td><td>{b.author}</td><td>{b.category?.name}</td>
          <td>{b.hasPdf && <span className="badge text-bg-danger me-1">PDF</span>}{b.hasEpub && <span className="badge text-bg-success">EPUB</span>}</td><td>{b.downloadCount}</td>
          <td>{b.isActive ? <span className="badge text-bg-success">Active</span> : <span className="badge text-bg-secondary">Hidden</span>} {b.isFeatured && <span className="badge text-bg-warning">Featured</span>}</td>
          <td className="text-nowrap"><Link href={`/admin/books/${b._id}`} className="btn btn-sm btn-outline-primary me-1">Edit</Link><button className="btn btn-sm btn-outline-danger" onClick={() => del(b)}>Delete</button></td></tr>)}
        {data?.books.length === 0 && <tr><td colSpan={7} className="text-muted text-center">No books found.</td></tr>}</tbody></table></div>}
      {data && data.pages > 1 && <div className="d-flex justify-content-center gap-2 align-items-center"><button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="small">Page {data.page} of {data.pages}</span><button className="btn btn-sm btn-outline-secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </>
  );
}
