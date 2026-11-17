import Link from 'next/link';
import { notFound } from 'next/navigation';
import { get, qs } from '@/lib/api';
import { clip } from '@/lib/config';
import { BookGrid } from '@/components/BookCard';
import Pagination from '@/components/Pagination';

const load = async (slug) => (await get(`/categories/slug/${encodeURIComponent(slug)}`))?.data || null;

export async function generateMetadata({ params, searchParams }) {
  const c = await load(params.slug);
  if (!c) return { title: 'Category not found', robots: { index: false } };
  const page = Number(searchParams.page) || 1;
  return { title: `${c.name} Books${page > 1 ? ` – Page ${page}` : ''}`, description: clip(c.description) || `Download free ${c.name} books in PDF and EPUB format.`, alternates: { canonical: `/categories/${c.slug}` + (page > 1 ? `?page=${page}` : '') } };
}

export default async function CategoryPage({ params, searchParams }) {
  const c = await load(params.slug);
  if (!c) notFound();
  const d = await get(`/books${qs({ category: c.slug, page: searchParams.page || 1, limit: 12 })}`);
  return (
    <div className="container py-4">
      <nav aria-label="Breadcrumb"><ol className="breadcrumb small"><li className="breadcrumb-item"><Link href="/">Home</Link></li><li className="breadcrumb-item"><Link href="/categories">Categories</Link></li><li className="breadcrumb-item active" aria-current="page">{c.name}</li></ol></nav>
      <h1 className="h2">{c.name}</h1>
      {c.description && <p className="text-muted">{c.description}</p>}
      {d ? <><BookGrid books={d.books} /><Pagination base={`/categories/${c.slug}`} page={d.page} pages={d.pages} /></> : <p className="text-muted">Could not load books.</p>}
    </div>
  );
}
