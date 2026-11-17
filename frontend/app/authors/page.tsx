import Link from 'next/link';
import { get, qs } from '@/lib/api';
import { imgUrl } from '@/lib/config';
import Pagination from '@/components/Pagination';
export const metadata = { title: 'Authors', description: 'Discover authors and download their books for free on RabiReads.', alternates: { canonical: '/authors' } };
export default async function Authors({ searchParams }) {
  const d = await get(`/authors${qs({ page: searchParams.page, limit: 24 })}`);
  return (
    <div className="container py-4">
      <h1 className="h2 mb-3">Authors</h1>
      {!d || !d.authors.length ? <p className="text-muted">No authors yet.</p> :
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {d.authors.map((a) => (
            <div className="col" key={a._id}><Link href={`/authors/${a.slug}`} className="card h-100 shadow-sm text-decoration-none text-reset book-card"><div className="card-body d-flex gap-3 align-items-center">
              {imgUrl(a.profileImage) ? <img className="avatar" src={imgUrl(a.profileImage)} alt={a.name} loading="lazy" /> : <div className="avatar d-flex align-items-center justify-content-center fs-4">{a.name[0]}</div>}
              <div><h2 className="h6 mb-0">{a.name}</h2><span className="small text-muted">{a.bookCount} book{a.bookCount === 1 ? '' : 's'}</span></div></div></Link></div>
          ))}
        </div>}
      {d && <Pagination base="/authors" page={d.page} pages={d.pages} />}
    </div>
  );
}
