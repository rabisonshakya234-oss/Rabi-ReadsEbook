'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { fmtDate } from '@/lib/config';
import Alert from '@/components/Alert';

export default function AdminDownloads() {
  const { token } = useAuth();
  const [days, setDays] = useState(30); const [page, setPage] = useState(1);
  const st = useLoad(() => api(`/admin/download-stats?days=${days}&top=10`, { token }), [token, days]);
  const ls = useLoad(() => api(`/downloads?page=${page}&limit=20`, { token }), [token, page]);
  const s = st.data?.data; const max = s ? Math.max(1, ...s.perDay.map((x) => x.count)) : 1;
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3"><h1 className="h3 mb-0">Download Statistics</h1>
        <select className="form-select w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 14, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}</select></div>
      <Alert error={st.error || ls.error} />
      {s && <>
        <div className="row g-3 mb-3">{[['Total', s.total], ['PDF', s.byFormat.pdf], ['EPUB', s.byFormat.epub], ['Logged-in / Guests', `${s.byUserType.loggedIn} / ${s.byUserType.guests}`]].map(([l, v]) => <div className="col-6 col-md-3" key={l}><div className="card card-body shadow-sm"><div className="text-muted small">{l}</div><div className="fs-4 fw-bold">{v}</div></div></div>)}</div>
        <div className="row g-3 mb-4"><div className="col-lg-8"><div className="card card-body shadow-sm"><h2 className="h6">Downloads per day</h2><div className="d-flex align-items-end gap-1" style={{ height: 130, overflowX: 'auto' }}>
          {s.perDay.map((x) => <div key={x.date} title={`${x.date}: ${x.count}`} className="bg-primary flex-fill rounded-top" style={{ height: `${(x.count / max) * 120}px`, minHeight: 2, minWidth: 6 }} />)}</div></div></div>
          <div className="col-lg-4"><div className="card card-body shadow-sm"><h2 className="h6">Top books</h2>{s.topBooks.length ? <ol className="mb-0 ps-3">{s.topBooks.map((b) => <li key={b._id}>{b.name} <span className="text-muted">({b.downloadCount})</span></li>)}</ol> : <p className="text-muted mb-0">No downloads yet.</p>}</div></div></div></>}
      <h2 className="h5">All downloads</h2>
      {ls.data && <div className="table-responsive"><table className="table table-sm bg-white"><thead><tr><th>Book</th><th>Format</th><th>User</th><th>Date</th></tr></thead><tbody>
        {ls.data.downloads.map((d) => <tr key={d._id}><td>{d.book?.name || d.nameAtDownload}</td><td className="text-uppercase">{d.format}</td><td>{d.user?.username || <span className="text-muted">guest</span>}</td><td>{fmtDate(d.downloadedAt)}</td></tr>)}</tbody></table></div>}
      {ls.data && ls.data.pages > 1 && <div className="d-flex justify-content-center gap-2 align-items-center"><button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="small">Page {ls.data.page} of {ls.data.pages}</span><button className="btn btn-sm btn-outline-secondary" disabled={page >= ls.data.pages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </>
  );
}
