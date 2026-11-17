import Link from 'next/link';
import { imgUrl } from '@/lib/config';

export default function BookCard({ book }) {
  const cover = imgUrl(book.coverImage);
  return (
    <div className="card h-100 book-card shadow-sm">
      <Link href={`/books/${book.slug}`} className="cover-wrap" aria-label={book.name}>
        {cover ? <img src={cover} alt={`Cover of ${book.name}`} loading="lazy" /> : <div className="cover-empty">{book.name}</div>}
      </Link>
      <div className="card-body d-flex flex-column">
        {book.category && <Link href={`/categories/${book.category.slug}`} className="badge text-bg-light border align-self-start mb-2 text-decoration-none">{book.category.name}</Link>}
        <h3 className="h6 card-title mb-1"><Link href={`/books/${book.slug}`} className="stretched-link-off text-reset text-decoration-none">{book.name}</Link></h3>
        <p className="small text-muted mb-2">{book.authorRef ? <Link href={`/authors/${book.authorRef.slug}`} className="text-muted">{book.author}</Link> : book.author}</p>
        <div className="mt-auto small">
          {book.hasPdf && <span className="badge text-bg-danger me-1">PDF</span>}
          {book.hasEpub && <span className="badge text-bg-success me-1">EPUB</span>}
        </div>
      </div>
    </div>
  );
}

export function BookGrid({ books }) {
  if (!books || !books.length) return <p className="text-muted">No books found.</p>;
  return <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">{books.map((b) => <div className="col" key={b._id}><BookCard book={b} /></div>)}</div>;
}
