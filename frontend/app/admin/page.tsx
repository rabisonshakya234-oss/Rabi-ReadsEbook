'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { fmtDate } from '@/lib/config';
import Alert from '@/components/Alert';

const Stat = ({ label, value, href }) => <div className="col-6 col-md-3"><Link href={href || '#'} className="card card-body shadow-sm text-decoration-none text-reset h-100"><div className="text-muted small">{label}</div><div className="fs-3 fw-bold">{value}</div></Link></div>;

export default function Dashboard() {
  const { token, guard } = useAuth();
  const { data, error, loading } = useLoad(() => api('/admin/dashboard', { token }), [token]);
  useEffect(() => { guard(error); }, [error, guard]);
  if (loading) return <p className="text-muted">Loading…</p>;
  if (error) return <Alert error={error} />;
  const d = data.data; const max = Math.max(1, ...d.downloads.last7Days.map((x) => x.count));
  return (
    <>
      <h1 className="h3 mb-3">Dashboard</h1>
      <div className="row g-3 mb-4">
        <Stat label="Books" value={d.books.total} href="/admin/books" /><Stat label="Active books" value={d.books.active} href="/admin/books" />
        <Stat label="Categories" value={d.categories} href="/admin/categories" /><Stat label="Authors" value={d.authors} href="/admin/authors" />
        <Stat label="Users" value={d.users.total} href="/admin/users" /><Stat label="Downloads" value={d.downloads.total} href="/admin/downloads" />
        <Stat label="PDF / EPUB downloads" value={`${d.downloads.byFormat.pdf} / ${d.downloads.byFormat.epub}`} href="/admin/downloads" /><Stat label="Unread messages" value={d.unreadMessages} href="/admin/messages" />
      </div>
      <div className="row g-3">
        <div className="col-lg-6"><div className="card card-body shadow-sm"><h2 className="h6">Downloads – last 7 days</h2>
          <div className="d-flex align-items-end gap-2" style={{ height: 140 }}>{d.downloads.last7Days.map((x) => <div key={x.date} className="flex-fill text-center small"><div className="bg-primary rounded-top" style={{ height: `${(x.count / max) * 100}px`, minHeight: 2 }} title={`${x.count}`} /><div style={{ fontSize: 10 }}>{x.date.slice(5)}</div><div>{x.count}</div></div>)}</div></div></div>
        <div className="col-lg-6"><div className="card card-body shadow-sm"><h2 className="h6">Top books</h2>
          {d.topBooks.length ? <ol className="mb-0">{d.topBooks.map((b) => <li key={b._id}>{b.name} <span className="text-muted">– {b.downloadCount}</span></li>)}</ol> : <p className="text-muted mb-0">No downloads yet.</p>}</div></div>
        <div className="col-lg-6"><div className="card card-body shadow-sm"><h2 className="h6">Recent books</h2>
          <ul className="mb-0">{d.recentBooks.map((b) => <li key={b._id}>{b.name} <span className="text-muted">– {fmtDate(b.createdAt)}</span></li>)}</ul></div></div>
        <div className="col-lg-6"><div className="card card-body shadow-sm"><h2 className="h6">Recent downloads</h2>
          {d.recentDownloads.length ? <ul className="mb-0">{d.recentDownloads.map((x) => <li key={x._id}>{x.book?.name || x.nameAtDownload} <span className="badge text-bg-secondary text-uppercase">{x.format}</span> <span className="text-muted">– {x.user?.username || 'guest'}</span></li>)}</ul> : <p className="text-muted mb-0">None yet.</p>}</div></div>
      </div>
    </>
  );
}
