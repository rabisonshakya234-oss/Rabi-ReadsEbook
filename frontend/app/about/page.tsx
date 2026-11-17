import Link from 'next/link';
export const metadata = { title: 'About Us', description: 'Learn about RabiReads, a free online library where you can download books as PDF or EPUB.', alternates: { canonical: '/about' } };
export default function About() {
  return (
    <div className="container py-5" style={{ maxWidth: 820 }}>
      <h1 className="mb-3">About RabiReads</h1>
      <p className="lead">RabiReads is a free online book library. Every book can be downloaded as a PDF, an EPUB, or both, with no payment and no shopping cart.</p>
      <h2 className="h4 mt-4">What you can do</h2>
      <ul>
        <li>Browse the whole collection or filter by category and author.</li>
        <li>Search by title, author or keyword.</li>
        <li>Download books in PDF or EPUB format.</li>
        <li>Create a free account to keep a history of your downloads.</li>
      </ul>
      <p>Questions or suggestions? <Link href="/contact">Contact us</Link>.</p>
    </div>
  );
}
