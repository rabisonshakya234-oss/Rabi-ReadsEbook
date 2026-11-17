import { get } from '@/lib/api';
import { SITE } from '@/lib/config';

export const revalidate = 3600;

import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const out: MetadataRoute.Sitemap = ['', '/books', '/categories', '/authors', '/about', '/contact'].map((p) => ({ url: SITE + p, lastModified: now, changeFrequency: (p === '' ? 'daily' : 'weekly') as 'daily' | 'weekly', priority: p === '' ? 1 : 0.7 }));
  // books come in pages of up to 50
  for (let page = 1; page <= 40; page++) {
    const d = await get(`/books?limit=50&page=${page}`, 3600);
    if (!d || !d.books) break;
    d.books.forEach((b) => out.push({ url: `${SITE}/books/${b.slug}`, lastModified: b.updatedAt ? new Date(b.updatedAt) : now, changeFrequency: 'monthly' as const, priority: 0.8 }));
    if (page >= d.pages) break;
  }
  const [c, a] = await Promise.all([get('/categories?limit=100', 3600), get('/authors?limit=100', 3600)]);
  (c?.categories || []).forEach((x) => out.push({ url: `${SITE}/categories/${x.slug}`, lastModified: now, priority: 0.6 }));
  (a?.authors || []).forEach((x) => out.push({ url: `${SITE}/authors/${x.slug}`, lastModified: now, priority: 0.5 }));
  return out;
}
