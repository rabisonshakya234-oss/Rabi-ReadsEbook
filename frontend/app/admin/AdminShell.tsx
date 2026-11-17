'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

const NAV = [['/admin', 'Dashboard'], ['/admin/books', 'Manage Books'], ['/admin/books/new', 'Add Book'], ['/admin/categories', 'Categories'], ['/admin/authors', 'Authors'], ['/admin/users', 'Users'], ['/admin/downloads', 'Download Statistics'], ['/admin/messages', 'Messages']];

export default function AdminShell({ children }) {
  const { user, ready, isAdmin } = useAuth(); const path = usePathname(); const router = useRouter();
  useEffect(() => { if (ready && !isAdmin) router.replace('/login?next=/admin'); }, [ready, isAdmin, router]);
  if (!ready || !isAdmin) return <div className="container py-5 text-muted">Checking access…</div>;
  return (
    <div className="container-fluid py-3">
      <div className="row g-3">
        <aside className="col-lg-2"><nav className="nav flex-lg-column admin-nav gap-1 bg-white p-2 rounded shadow-sm" aria-label="Admin">
          {NAV.map(([h, t]) => <Link key={h} href={h} className={'nav-link' + (path === h ? ' active' : '')}>{t}</Link>)}
        </nav><p className="small text-muted mt-2 px-2">Signed in as {user.username}</p></aside>
        <section className="col-lg-10">{children}</section>
      </div>
    </div>
  );
}
