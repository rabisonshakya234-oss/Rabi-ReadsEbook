import Link from 'next/link';
import { notFound } from 'next/navigation';
import { get } from '@/lib/api';
import { imgUrl, fmtDate, clip, SITE, SITE_NAME } from '@/lib/config';
import DownloadButtons from '@/components/DownloadButtons';
import { BookGrid } from '@/components/BookCard';

const load = async (slug) => (await get(`/books/slug/${encodeURIComponent(slug)}`))?.data || null;

export async function generateMetadata({ params }) {
  const b = await load(params.slug);
  if (!b) return { title: 'Book not found', robots: { index: false } };
  const desc = clip(b.description);
  const cover = imgUrl(b.coverImage);
  return {
    title: `${b.name} by ${b.author} – Free PDF & EPUB Download`,
    description: desc,
    alternates: { canonical: `/books/${b.slug}` },
    openGraph: { type: 'book', title: `${b.name} by ${b.author}`, description: desc, url: `${SITE}/books/${b.slug}`, siteName: SITE_NAME, images: cover ? [{ url: cover, alt: `Cover of ${b.name}` }] : undefined },
    twitter: { card: cover ? 'summary_large_image' : 'summary', title: b.name, description: desc, images: cover ? [cover] : undefined },
  };
}

export default async function BookPage({ params }) {
  const b = await load(params.slug);
  if (!b) notFound();
  const cover = imgUrl(b.coverImage);
  const related = b.category ? await get(`/books?category=${b.category.slug}&limit=5`) : null;
  const more = (related?.books || []).filter((x) => x._id !== b._id).slice(0, 4);
  const formats = [b.hasPdf && 'PDF', b.hasEpub && 'EPUB'].filter(Boolean);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Book', name: b.name, url: `${SITE}/books/${b.slug}`,
    author: { '@type': 'Person', name: b.author }, description: clip(b.description, 300), inLanguage: b.language || undefined,
    isbn: b.isbn || undefined, datePublished: b.publishedDate ? new Date(b.publishedDate).toISOString().slice(0, 10) : b.publishedYear ? String(b.publishedYear) : undefined,
    numberOfPages: b.pages || undefined, image: cover || undefined, genre: b.category?.name,
    isAccessibleForFree: true,
    workExample: formats.map((f) => ({ '@type': 'Book', bookFormat: f === 'EPUB' ? 'https://schema.org/EBook' : 'https://schema.org/EBook', encodingFormat: f === 'EPUB' ? 'application/epub+zip' : 'application/pdf', isAccessibleForFree: true })),
  };
  const rows = [
    ['Author', b.authorRef ? <Link href={`/authors/${b.authorRef.slug}`}>{b.author}</Link> : b.author],
    ['Category', b.category && <Link href={`/categories/${b.category.slug}`}>{b.category.name}</Link>],
    ['Language', b.language], ['Pages', b.pages || null],
    ['Published', b.publishedDate ? fmtDate(b.publishedDate) : b.publishedYear], ['ISBN', b.isbn],
    ['Formats', formats.join(', ')], ['Downloads', b.downloadCount],
  ].filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false);
  return (
    <div className="container py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav aria-label="Breadcrumb"><ol className="breadcrumb small">
        <li className="breadcrumb-item"><Link href="/">Home</Link></li><li className="breadcrumb-item"><Link href="/books">Books</Link></li>
        {b.category && <li className="breadcrumb-item"><Link href={`/categories/${b.category.slug}`}>{b.category.name}</Link></li>}
        <li className="breadcrumb-item active" aria-current="page">{b.name}</li>
      </ol></nav>
      <article className="row g-4">
        <div className="col-md-4 col-lg-3">
          <div className="cover-wrap shadow rounded">{cover ? <img src={cover} alt={`Cover of ${b.name}`} /> : <div className="cover-empty">{b.name}</div>}</div>
        </div>
        <div className="col-md-8 col-lg-9">
          <h1 className="h2">{b.name}</h1>
          <p className="text-muted">by {b.authorRef ? <Link href={`/authors/${b.authorRef.slug}`}>{b.author}</Link> : b.author}</p>
          <div className="my-3"><DownloadButtons book={b} /></div>
          <h2 className="h5 mt-4">About this book</h2>
          <p className="prose">{b.description}</p>
          <h2 className="h5 mt-4">Book details</h2>
          <table className="table table-sm w-auto"><tbody>{rows.map(([k, v]) => <tr key={k}><th scope="row" className="pe-4">{k}</th><td>{v}</td></tr>)}</tbody></table>
        </div>
      </article>
      {more.length > 0 && <section className="mt-5"><h2 className="h4 mb-3">More in {b.category.name}</h2><BookGrid books={more} /></section>}
    </div>
  );
}
