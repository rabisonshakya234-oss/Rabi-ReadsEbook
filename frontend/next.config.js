/** @type {import('next').NextConfig} */

// Browser le same origin (yo site) lai call garchha, Next.js le /api ra /uploads lai Express backend ma forward garchha.
// Yesle CORS problem hudaina.
const BACKEND = (process.env.BACKEND_URL || 'https://rabi-readsebook-fixed-9buv.onrender.com').replace(/\/+$/, '');

let backendHost = 'rabi-readsebook-fixed-9buv.onrender.com';
try {
  backendHost = new URL(BACKEND).hostname;
} catch (e) {
  console.warn('BACKEND_URL invalid chha:', BACKEND);
}

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // next/image le backend ko /uploads image load garna sakos bhanera
    remotePatterns: [
      { protocol: 'https', hostname: backendHost, pathname: '/uploads/**' },
    ],
    // Render free plan ma image optimization slow huna sakchha, tesaile off
    unoptimized: true,
  },

  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND}/uploads/:path*` },
    ];
  },
};
