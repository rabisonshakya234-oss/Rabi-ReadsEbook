import Link from 'next/link';
import { qs } from '@/lib/api';

// Server-rendered pagination with real links (good for crawlers).
export default function Pagination({ base, params = {}, page = 1, pages = 1 }) {
  if (pages <= 1) return null;
  const href = (p) => base + qs({ ...params, page: p > 1 ? p : undefined });
  const nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
  return (
    <nav aria-label="Pagination" className="mt-4">
      <ul className="pagination justify-content-center flex-wrap">
        <li className={'page-item' + (page <= 1 ? ' disabled' : '')}><Link className="page-link" href={href(page - 1)} rel="prev">Previous</Link></li>
        {nums.map((n) => <li key={n} className={'page-item' + (n === page ? ' active' : '')}><Link className="page-link" href={href(n)}>{n}</Link></li>)}
        <li className={'page-item' + (page >= pages ? ' disabled' : '')}><Link className="page-link" href={href(page + 1)} rel="next">Next</Link></li>
      </ul>
    </nav>
  );
}
