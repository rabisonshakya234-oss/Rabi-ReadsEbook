'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import { fmtDate } from '@/lib/config';
import Alert from '@/components/Alert';
import { BookGrid } from '@/components/BookCard';

export default function AccountView() {
  const { user, token, ready, guard } = useAuth(); const router = useRouter();
  useEffect(() => { if (ready && !user) router.replace('/login?next=/account'); }, [ready, user, router]);
  const lib = useLoad(() => (token ? api('/downloads/library', { token }) : null), [token]);
  const hist = useLoad(() => (token ? api('/downloads/my?limit=20', { token }) : null), [token]);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [err, setErr] = useState(null); const [ok, setOk] = useState('');
  useEffect(() => { guard(lib.error); }, [lib.error, guard]);
  if (!ready || !user) return <div className="container py-5 text-muted">Loading…</div>;
  const change = async (e) => {
    e.preventDefault(); setErr(null); setOk('');
    try { setOk((await api('/auth/change-password', { method: 'PATCH', token, body: pw })).message); setPw({ currentPassword: '', newPassword: '', confirmPassword: '' }); } catch (x) { setErr(x); }
  };
  const on = (k) => (e) => setPw({ ...pw, [k]: e.target.value });
  return (
    <div className="container py-4">
      <h1 className="h2">Hello, {user.username}</h1>
      <p className="text-muted">{user.email}</p>
      <section className="mb-5"><h2 className="h4 mb-3">My library</h2>
        {lib.loading ? <p className="text-muted">Loading…</p> : lib.data?.books?.length ? <BookGrid books={lib.data.books} /> : <p className="text-muted">Books you download while logged in appear here. <Link href="/books">Browse books</Link></p>}
      </section>
      <section className="mb-5"><h2 className="h4 mb-3">Download history</h2>
        {hist.data?.downloads?.length ? <div className="table-responsive"><table className="table table-sm bg-white"><thead><tr><th>Book</th><th>Format</th><th>Date</th></tr></thead><tbody>
          {hist.data.downloads.map((d) => <tr key={d._id}><td>{d.book ? <Link href={`/books/${d.book.slug}`}>{d.book.name}</Link> : d.nameAtDownload}</td><td className="text-uppercase">{d.format}</td><td>{fmtDate(d.downloadedAt)}</td></tr>)}</tbody></table></div> : <p className="text-muted">No downloads yet.</p>}
      </section>
      <section style={{ maxWidth: 440 }}><h2 className="h4 mb-3">Change password</h2>
        <form onSubmit={change} className="card card-body shadow-sm"><Alert error={err} ok={ok} />
          <input type="password" className="form-control mb-2" placeholder="Current password" value={pw.currentPassword} onChange={on('currentPassword')} required autoComplete="current-password" />
          <input type="password" className="form-control mb-2" placeholder="New password (8+ chars, letter and number)" value={pw.newPassword} onChange={on('newPassword')} required minLength={8} autoComplete="new-password" />
          <input type="password" className="form-control mb-3" placeholder="Confirm new password" value={pw.confirmPassword} onChange={on('confirmPassword')} required autoComplete="new-password" />
          <button className="btn btn-primary">Update password</button></form>
      </section>
    </div>
  );
}
