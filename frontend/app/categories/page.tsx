import Link from 'next/link';
import { get } from '@/lib/api';
export const metadata = { title: 'Book Categories', description: 'Browse free PDF and EPUB books by category on RabiReads.', alternates: { canonical: '/categories' } };
export default async function Categories() {
  const d = await get('/categories?limit=100');
  return (
    <div className="container py-4">
      <h1 className="h2 mb-3">Book Categories</h1>
      {!d || !d.categories.length ? <p className="text-muted">No categories yet.</p> :
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {d.categories.map((c) => (
            <div className="col" key={c._id}><Link href={`/categories/${c.slug}`} className="card h-100 shadow-sm text-decoration-none text-reset book-card"><div className="card-body">
              <h2 className="h5">{c.name} <span className="badge text-bg-primary">{c.bookCount}</span></h2>
              <p className="text-muted small mb-0">{c.description || `Books in ${c.name}`}</p></div></Link></div>
          ))}
        </div>}
    </div>
  );
}
