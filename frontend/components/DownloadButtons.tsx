'use client';
import { useEffect, useRef, useState } from 'react';
import { downloadBook } from '@/lib/api';
import { useAuth } from './AuthProvider';
import { fmtSize } from '@/lib/config';

export default function DownloadButtons({ book }) {
  const { token } = useAuth();
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside of it or pressing Escape.
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, []);

  const go = async (f) => {
    setOpen(false); setErr(''); setBusy(f);
    try { await downloadBook(book._id, f, token); } catch (e) { setErr(e.message); }
    setBusy('');
  };
  if (!book.hasFile) return <p className="text-muted">No file is available for this book yet.</p>;
  const size = (k) => (fmtSize(book.files?.[k]?.size) ? ' (' + fmtSize(book.files[k].size) + ')' : '');
  return (
    <div>
      <div className="dropdown d-inline-block" ref={ref}>
        <button type="button" className="btn btn-primary dropdown-toggle" aria-haspopup="true" aria-expanded={open} disabled={!!busy} onClick={() => setOpen(!open)}>
          {busy ? 'Downloading…' : '⬇ Download'}
        </button>
        <ul className={`dropdown-menu${open ? ' show' : ''}`}>
          <li><button type="button" className="dropdown-item" disabled={!book.hasEpub} onClick={() => go('epub')}>EPUB{book.hasEpub ? size('epub') : ' (not available)'}</button></li>
          <li><button type="button" className="dropdown-item" disabled={!book.hasPdf} onClick={() => go('pdf')}>PDF{book.hasPdf ? size('pdf') : ' (not available)'}</button></li>
        </ul>
      </div>
      {err && <div className="text-danger small mt-2" role="alert">{err}</div>}
    </div>
  );
}
