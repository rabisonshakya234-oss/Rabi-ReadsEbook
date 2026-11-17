# RabiReads – Next.js frontend

Next.js 14 (App Router, TypeScript / TSX) + Bootstrap 5. Talks to the Express backend in `../backend` (the backend is unchanged).

## Run

```bash
# 1. backend (in ../backend)
npm install && npm run seed && npm run dev      # http://localhost:5000

# 2. frontend (in this folder)
npm install
npm run dev                                     # http://localhost:3000
```

`.env.local` (copy from `.env.local.example`). The browser calls this site and `next.config.js` forwards `/api` and `/uploads` to the backend, so CORS is never involved:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Backend `.env` settings to add (no code changes)

```
CLIENT_URL=http://localhost:3000                       # CORS: allows this site to call the API
RESET_PAGE_URL=http://localhost:3000/reset-password    # password-reset emails link to <this>/<token>
```

Log in as the admin created by `npm run seed` (ADMIN_EMAIL / ADMIN_PASSWORD from the backend `.env`) and open `/admin`.

## Pages

| Public | Admin (role = admin) |
|---|---|
| `/` home (featured + latest) | `/admin` dashboard |
| `/books` browse, filter, sort, paginate | `/admin/books`, `/admin/books/new`, `/admin/books/[id]` |
| `/books/[slug]` details + PDF / EPUB download | `/admin/categories` |
| `/search?q=` search results | `/admin/authors` |
| `/categories`, `/categories/[slug]` | `/admin/users` |
| `/authors`, `/authors/[slug]` | `/admin/downloads` statistics |
| `/about`, `/contact` | `/admin/messages` contact inbox |
| `/login`, `/register`, `/forgot-password`, `/reset-password/[token]`, `/account` | |

## SEO

- Public pages are server-rendered with per-page `<title>`, description, canonical URL, Open Graph and Twitter tags.
- JSON-LD: `WebSite` + `SearchAction` (all pages), `Book` (book pages), `Person` (author pages).
- `/sitemap.xml` is built from the API (books, categories, authors); `/robots.txt` blocks admin, account and auth pages.
- Pagination, filters and search are real links / GET forms, so crawlers can follow them. Filtered and search URLs are `noindex`.
- Semantic HTML, breadcrumbs, image `alt` text, lazy-loaded images.
- Set `NEXT_PUBLIC_SITE_URL` to your real domain in production.

## Notes

- Login token is kept in `localStorage`; downloads use `fetch` with the token so logged-in downloads reach the user's history (guests can still download).
- File type and size are checked in the browser before upload; the backend still verifies file contents.
- Public pages refresh from the API every 60 seconds (ISR).
