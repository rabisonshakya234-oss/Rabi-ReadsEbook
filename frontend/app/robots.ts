import { SITE } from '@/lib/config';
export default function robots() {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/account', '/login', '/register', '/forgot-password', '/reset-password'] }], sitemap: `${SITE}/sitemap.xml` };
}
