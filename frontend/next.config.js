/** @type {import('next').NextConfig} */
// The browser calls this site (same origin) and Next.js forwards /api and /uploads to the Express backend.
// This avoids CORS problems completely, so the backend CLIENT_URL setting no longer matters.
const BACKEND = (process.env.BACKEND_URL || 'https://rabi-readsebook-fixed-9buv.onrender.com').replace(/\/+$/, '');

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
    ];
  },
};
