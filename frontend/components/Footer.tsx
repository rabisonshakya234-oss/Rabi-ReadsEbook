import Link from 'next/link';
export default function Footer() {
  return (
    <footer className="bg-dark text-light mt-5 py-4">
      <div className="container d-flex flex-column flex-md-row justify-content-between gap-2">
        <div><strong>📚 RabiReads</strong><div className="small text-secondary">Free PDF and EPUB books. Read anywhere.</div></div>
        <nav aria-label="Footer" className="d-flex flex-wrap gap-3 small">
          <Link href="/books" className="link-light">Books</Link><Link href="/categories" className="link-light">Categories</Link>
          <Link href="/authors" className="link-light">Authors</Link><Link href="/about" className="link-light">About</Link><Link href="/contact" className="link-light">Contact</Link>
        </nav>
        <div className="small text-secondary">© {new Date().getFullYear()} RabiReads</div>
      </div>
    </footer>
  );
}
