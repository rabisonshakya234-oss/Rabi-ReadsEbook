'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, ready, logout, isAdmin } = useAuth();
  const router = useRouter();
  const go = () => setOpen(false);
  const links = [['/books', 'All Books'], ['/categories', 'Categories'], ['/authors', 'Authors'], ['/about', 'About'], ['/contact', 'Contact']];
  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary" href="/" onClick={go}>📚 RabiReads</Link>
        <button className="navbar-toggler" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}><span className="navbar-toggler-icon" /></button>
        <div className={'collapse navbar-collapse' + (open ? ' show' : '')}>
          <ul className="navbar-nav me-auto">
            {links.map(([h, t]) => <li className="nav-item" key={h}><Link className="nav-link" href={h} onClick={go}>{t}</Link></li>)}
          </ul>
          <form action="/search" method="get" role="search" className="d-flex me-lg-3 my-2 my-lg-0" style={{ gap: 6 }}>
            <input name="q" type="search" className="form-control form-control-sm" placeholder="Search books" aria-label="Search books" maxLength={100} />
            <button className="btn btn-sm btn-outline-primary" type="submit">Search</button>
          </form>
          <ul className="navbar-nav align-items-lg-center">
            {ready && !user && (<>
              <li className="nav-item"><Link className="nav-link" href="/login" onClick={go}>Login</Link></li>
              <li className="nav-item"><Link className="btn btn-sm btn-primary" href="/register" onClick={go}>Register</Link></li>
            </>)}
            {ready && user && (<>
              {isAdmin && <li className="nav-item"><Link className="nav-link fw-semibold" href="/admin" onClick={go}>Admin</Link></li>}
              <li className="nav-item"><Link className="nav-link" href="/account" onClick={go}>{user.username}</Link></li>
              <li className="nav-item"><button className="btn btn-sm btn-outline-secondary" onClick={async () => { go(); await logout(); router.push('/'); }}>Logout</button></li>
            </>)}
          </ul>
        </div>
      </div>
    </nav>
  );
}
