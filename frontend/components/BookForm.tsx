'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from './AuthProvider';
import Alert from './Alert';

const MB = 1024 * 1024;
const RULES = { pdf: { ext: ['.pdf'], mb: 100 }, epub: { ext: ['.epub'], mb: 100 }, cover: { ext: ['.jpg', '.jpeg', '.png', '.webp'], mb: 5 } };

// Used by Add Book and Edit Book. `book` is set when editing.
export default function BookForm({ book }: { book?: any }) {
  const { token } = useAuth(); const router = useRouter();
  const [cats, setCats] = useState([]); const [authors, setAuthors] = useState([]);
  const [f, setF] = useState({
    name: book?.name || '', authorId: book?.authorRef?._id || '', author: book?.author || '', category: book?.category?._id || '',
    description: book?.description || '', pages: book?.pages || '', language: book?.language || 'English',
    publishedDate: book?.publishedDate ? book.publishedDate.slice(0, 10) : '', isbn: book?.isbn || '',
    isActive: book ? book.isActive : true, isFeatured: book ? book.isFeatured : false,
  });
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/categories?limit=100').then((r) => setCats(r.categories)).catch(() => {});
    api('/authors?limit=100').then((r) => setAuthors(r.authors)).catch(() => {});
  }, []);

  const on = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // Check the file type and size in the browser first. The server also checks the real file contents.
  const pick = (k) => (e) => {
    const file = e.target.files[0];
    if (!file) return setFiles({ ...files, [k]: undefined });
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!RULES[k].ext.includes(ext)) { e.target.value = ''; return setErr(new Error(`${k.toUpperCase()} must be ${RULES[k].ext.join(', ')}`)); }
    if (file.size > RULES[k].mb * MB) { e.target.value = ''; return setErr(new Error(`${k.toUpperCase()} file is larger than ${RULES[k].mb} MB`)); }
    setErr(null); setFiles({ ...files, [k]: file });
  };

  const submit = async (e) => {
    e.preventDefault(); setErr(null);
    if (!book && !files.pdf && !files.epub) return setErr(new Error('Upload at least one file: a PDF or an EPUB'));
    if (!f.authorId && !f.author.trim()) return setErr(new Error('Choose an author or type the author name'));
    const fd = new FormData();
    fd.append('name', f.name); fd.append('description', f.description); fd.append('category', f.category);
    if (f.authorId) fd.append('authorId', f.authorId); else fd.append('author', f.author);
    ['language', 'isbn', 'pages', 'publishedDate'].forEach((k) => { if (f[k] !== '' && f[k] !== null) fd.append(k, f[k]); });
    fd.append('isActive', String(f.isActive)); fd.append('isFeatured', String(f.isFeatured));
    ['pdf', 'epub', 'cover'].forEach((k) => { if (files[k]) fd.append(k, files[k]); });
    setBusy(true);
    try { await api(book ? `/books/${book._id}` : '/books', { method: book ? 'PATCH' : 'POST', form: fd, token }); router.push('/admin/books'); }
    catch (x) { setErr(x); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card card-body shadow-sm">
      <Alert error={err} />
      <div className="row g-3">
        <div className="col-md-8"><label className="form-label">Title *</label><input className="form-control" value={f.name} onChange={on('name')} required maxLength={150} /></div>
        <div className="col-md-4"><label className="form-label">Category *</label>
          <select className="form-select" value={f.category} onChange={on('category')} required><option value="">Select…</option>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
        <div className="col-md-6"><label className="form-label">Author (from list)</label>
          <select className="form-select" value={f.authorId} onChange={(e) => { const a = authors.find((x) => x._id === e.target.value); setF({ ...f, authorId: e.target.value, author: a ? a.name : f.author }); }}>
            <option value="">— type a name instead —</option>{authors.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}</select></div>
        <div className="col-md-6"><label className="form-label">Author name</label><input className="form-control" value={f.author} onChange={on('author')} disabled={!!f.authorId} maxLength={100} /></div>
        <div className="col-12"><label className="form-label">Description *</label><textarea className="form-control" rows={5} value={f.description} onChange={on('description')} required maxLength={5000} /></div>
        <div className="col-md-3"><label className="form-label">Pages</label><input type="number" min={0} className="form-control" value={f.pages} onChange={on('pages')} /></div>
        <div className="col-md-3"><label className="form-label">Language</label><input className="form-control" value={f.language} onChange={on('language')} maxLength={40} /></div>
        <div className="col-md-3"><label className="form-label">Publication date</label><input type="date" className="form-control" value={f.publishedDate} onChange={on('publishedDate')} /></div>
        <div className="col-md-3"><label className="form-label">ISBN (optional)</label><input className="form-control" value={f.isbn} onChange={on('isbn')} maxLength={20} /></div>
        <div className="col-md-4"><label className="form-label">PDF file {book?.hasPdf && <span className="badge text-bg-success">uploaded</span>}</label><input type="file" accept=".pdf,application/pdf" className="form-control" onChange={pick('pdf')} /></div>
        <div className="col-md-4"><label className="form-label">EPUB file {book?.hasEpub && <span className="badge text-bg-success">uploaded</span>}</label><input type="file" accept=".epub,application/epub+zip" className="form-control" onChange={pick('epub')} /></div>
        <div className="col-md-4"><label className="form-label">Cover image</label><input type="file" accept=".jpg,.jpeg,.png,.webp,image/*" className="form-control" onChange={pick('cover')} /></div>
        <div className="col-12 form-text mt-0">At least one of PDF or EPUB is required. PDF/EPUB up to 100 MB, cover up to 5 MB (JPG, PNG or WEBP). {book && 'Choosing a new file replaces the old one.'}</div>
        <div className="col-12 d-flex gap-4">
          <div className="form-check"><input id="act" type="checkbox" className="form-check-input" checked={f.isActive} onChange={on('isActive')} /><label htmlFor="act" className="form-check-label">Active (visible on the site)</label></div>
          <div className="form-check"><input id="feat" type="checkbox" className="form-check-input" checked={f.isFeatured} onChange={on('isFeatured')} /><label htmlFor="feat" className="form-check-label">Featured on home page</label></div>
        </div>
      </div>
      <div className="mt-4 d-flex gap-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : book ? 'Save changes' : 'Add book'}</button><button type="button" className="btn btn-outline-secondary" onClick={() => router.push('/admin/books')}>Cancel</button></div>
    </form>
  );
}
