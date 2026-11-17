import Link from 'next/link';
import { get, qs } from '@/lib/api';
import { BookGrid } from '@/components/BookCard';
import Pagination from '@/components/Pagination';
import SearchBar from '@/components/SearchBar';

export async function generateMetadata({ searchParams }) {
  const page = Number(searchParams.page) || 1;
  return {
    title: page > 1 ? `All Books – Page ${page}` : 'All Books',
    description: 'Browse every free PDF and EPUB book in the RabiReads library. Filter by category and sort by newest, title or popularity.',
    alternates: { canonical: '/books' + (page > 1 ? `?page=${page}` : '') },
    robots: searchParams.category || searchParams.sort ? { index: false, follow: true } : undefined,
  };
}

const SORTS = [['-createdAt', 'Newest'], ['name', 'Title A–Z'], ['-name', 'Title Z–A'], ['-downloadCount', 'Most downloaded']];

export default async function Books({ searchParams }) {
  const { category = '', sort = '-createdAt', page = '1' } = searchParams;
  const [d, cats] = await Promise.all([get(`/books${qs({ category, sort, page, limit: 12 })}`), get('/categories?limit=100')]);
  const params = { category, sort: sort !== '-createdAt' ? sort : '' };
  return (
    <div className="container py-4">
      <h1 className="h2 mb-3">All Books</h1>
      <div className="row g-4">
        <aside className="col-lg-3">
          <div className="mb-3"><SearchBar /></div>
          <h2 className="h6">Categories</h2>
          <div className="list-group mb-3">
            <Link href={'/books' + qs({ sort: params.sort })} className={'list-group-item list-group-item-action' + (!category ? ' active' : '')}>All</Link>
            {(cats?.categories || []).map((c) => <Link key={c._id} href={'/books' + qs({ category: c.slug, sort: params.sort })} className={'list-group-item list-group-item-action d-flex justify-content-between' + (category === c.slug ? ' active' : '')}>{c.name}<span className="badge text-bg-secondary">{c.bookCount}</span></Link>)}
          </div>
          <h2 className="h6">Sort by</h2>
          <div className="list-group">
            {SORTS.map(([v, t]) => <Link key={v} href={'/books' + qs({ category, sort: v !== '-createdAt' ? v : '' })} className={'list-group-item list-group-item-action' + (sort === v ? ' active' : '')}>{t}</Link>)}
          </div>
        </aside>
        <div className="col-lg-9">
          {d ? <><p className="text-muted small">{d.total} book{d.total === 1 ? '' : 's'}</p><BookGrid books={d.books} /><Pagination base="/books" params={params} page={d.page} pages={d.pages} /></> : <p className="text-muted">Could not load books. Please try again shortly.</p>}
        </div>
      </div>
    </div>
  );
}
