import Link from 'next/link';
export const metadata = { title: 'Page not found', robots: { index: false } };
export default function NotFound() {
  return <div className="container py-5 text-center"><h1 className="display-5">404 – Page not found</h1><p className="text-muted">The page you are looking for does not exist.</p><Link href="/books" className="btn btn-primary">Browse books</Link></div>;
}
