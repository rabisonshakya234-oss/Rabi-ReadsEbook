import { get, qs } from '@/lib/api';
import { BookGrid } from '@/components/BookCard';
import Pagination from '@/components/Pagination';
import SearchBar from '@/components/SearchBar';

export async function generateMetadata({ searchParams }) {
  const q = (searchParams.q || '').trim();
  return { title: q ? `Search results for “${q}”` : 'Search books', description: q ? `Books matching “${q}” in the RabiReads library.` : 'Search the RabiReads library by title, author or keyword.', robots: { index: false, follow: true } };
}

export default async function Search({ searchParams }) {
  const q = (searchParams.q || '').trim().slice(0, 100);
  const page = searchParams.page || '1';
  const d = q ? await get(`/books${qs({ search: q, page, limit: 12 })}`, 30) : null;
  return (
    <div className="container py-4">
      <h1 className="h2 mb-3">Search</h1>
      <div className="mb-4" style={{ maxWidth: 560 }}><SearchBar defaultValue={q} /></div>
      {!q && <p className="text-muted">Type a title, an author or a keyword above.</p>}
      {q && !d && <p className="text-muted">Search is unavailable right now.</p>}
      {d && <><p className="text-muted">{d.total} result{d.total === 1 ? '' : 's'} for “{q}”</p><BookGrid books={d.books} /><Pagination base="/search" params={{ q }} page={d.page} pages={d.pages} /></>}
    </div>
  );
}
