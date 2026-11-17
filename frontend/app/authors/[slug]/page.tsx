import Link from 'next/link';
import { notFound } from 'next/navigation';
import { get, qs } from '@/lib/api';
import { imgUrl, clip, SITE } from '@/lib/config';
import { BookGrid } from '@/components/BookCard';
import Pagination from '@/components/Pagination';

const load = async (slug) => (await get(`/authors/slug/${encodeURIComponent(slug)}`))?.data || null;

export async function generateMetadata({ params }) {
  const a = await load(params.slug);
  if (!a) return { title: 'Author not found', robots: { index: false } };
  const img = imgUrl(a.profileImage);
  return { title: `${a.name} – Books & Biography`, description: clip(a.biography) || `Download free books by ${a.name} in PDF and EPUB format.`, alternates: { canonical: `/authors/${a.slug}` }, openGraph: { type: 'profile', title: a.name, images: img ? [img] : undefined } };
}

export default async function AuthorPage({ params, searchParams }) {
  const a = await load(params.slug);
  if (!a) notFound();
  const d = await get(`/books${qs({ authorId: a._id, page: searchParams.page || 1, limit: 12 })}`);
  const img = imgUrl(a.profileImage);
  const ld = { '@context': 'https://schema.org', '@type': 'Person', name: a.name, url: `${SITE}/authors/${a.slug}`, description: clip(a.biography, 300) || undefined, image: img || undefined };
  return (
    <div className="container py-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav aria-label="Breadcrumb"><ol className="breadcrumb small"><li className="breadcrumb-item"><Link href="/">Home</Link></li><li className="breadcrumb-item"><Link href="/authors">Authors</Link></li><li className="breadcrumb-item active" aria-current="page">{a.name}</li></ol></nav>
      <div className="d-flex gap-3 align-items-start mb-4">
        {img ? <img className="avatar" style={{ width: 110, height: 110 }} src={img} alt={a.name} /> : <div className="avatar d-flex align-items-center justify-content-center fs-2" style={{ width: 110, height: 110 }}>{a.name[0]}</div>}
        <div><h1 className="h2">{a.name}</h1>{a.biography && <p className="prose mb-0">{a.biography}</p>}</div>
      </div>
      <h2 className="h4 mb-3">Books by {a.name}</h2>
      {d ? <><BookGrid books={d.books} /><Pagination base={`/authors/${a.slug}`} page={d.page} pages={d.pages} /></> : <p className="text-muted">Could not load books.</p>}
    </div>
  );
}
