import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SITE, SITE_NAME } from '@/lib/config';

const description = 'RabiReads is a free online book library. Browse, search and download books as PDF or EPUB.';

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: `${SITE_NAME} – Free PDF & EPUB Book Library`, template: `%s | ${SITE_NAME}` },
  description,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: SITE_NAME, title: `${SITE_NAME} – Free PDF & EPUB Book Library`, description, url: SITE },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description },
  robots: { index: true, follow: true },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0d6efd' };

export default function RootLayout({ children }) {
  const ld = {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE,
    potentialAction: { '@type': 'SearchAction', target: `${SITE}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };
  return (
    <html lang="en">
      <body className="d-flex flex-column min-vh-100">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <AuthProvider>
          <Navbar />
          <main className="flex-grow-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
