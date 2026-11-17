import Link from 'next/link';
import { get } from '@/lib/api';
import { BookGrid } from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';

export const revalidate = 60;
export const metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const [featured, latest, cats] = await Promise.all([get('/books?featured=true&limit=8'), get('/books?limit=8&sort=-createdAt'), get('/categories?limit=12')]);
  return (
    <>
      <section className="hero py-5">
        <div className="container py-4 text-center">
          <h1 className="display-5 fw-bold">Free books. PDF &amp; EPUB. One click.</h1>
          <p className="lead mb-4">Browse our online library and download your next read for free.</p>
          <div className="mx-auto" style={{ maxWidth: 560 }}><SearchBar size="form-control-lg" /></div>
        </div>
      </section>

      <div className="container py-5">
        {cats?.categories?.length > 0 && (
          <section className="mb-5" aria-labelledby="cats">
            <h2 id="cats" className="h4 mb-3">Browse by category</h2>
            <div className="d-flex flex-wrap gap-2">
              {cats.categories.map((c) => <Link key={c._id} href={`/categories/${c.slug}`} className="btn btn-outline-primary btn-sm">{c.name} <span className="badge text-bg-primary">{c.bookCount}</span></Link>)}
            </div>
          </section>
        )}

        {featured?.books?.length > 0 && (
          <section className="mb-5" aria-labelledby="feat">
            <h2 id="feat" className="h4 mb-3">Featured books</h2>
            <BookGrid books={featured.books} />
          </section>
        )}

        <section aria-labelledby="latest">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 id="latest" className="h4 mb-0">Latest books</h2>
            <Link href="/books" className="small">View all →</Link>
          </div>
          {latest ? <BookGrid books={latest.books} /> : <p className="text-muted">The library is not reachable right now. Please try again shortly.</p>}
        </section>
      </div>
    </>
  );
}
