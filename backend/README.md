# RabiReads – Backend (Express.js + MongoDB)

Dynamic online library with free **PDF** and **EPUB** downloads. No cart, products or payments.

## Run

```bash
npm install
# edit .env  (MONGODB_URI and Auth_SecretKey are required)
npm run seed        # admin account + 6 categories + 12 authors + 12 sample books (each with a sample PDF)
npm run dev         # or: npm start      -> http://localhost:5000/api
```

`npm run seed -- --fresh` wipes categories, authors, books and downloads first (development only).

## Folders

```
config/       env + database connection
controllers/  request handlers
Service/      business logic
models/       Mongoose models: User, Book, Category, Author, Download, ContactMessage, TokenBlacklist
routes/       URL -> controller
middleware/   AuthMiddleware, RoleMiddleware, RateLimiterMiddleware, FileHandleMiddleware (Multer + file checks)
validator/    request validation
utils/        helpers (errors, tokens, email, rate limiters)
uploads/      covers/ and authors/ (public images), ebooks/ (private PDF + EPUB)
app.js        express app + starts the server
```

## MongoDB collections

| Collection | Main fields |
|---|---|
| users | username, email, password (bcrypt hash), role (`user` / `admin`) |
| books | name (title), author, authorRef, category, description, coverImage, files.pdf, files.epub, publishedDate, publishedYear, language, isbn, pages, isFeatured, isActive, downloadCount |
| categories | name, slug, description |
| authors | name, slug, biography, profileImage |
| downloads | user (empty for guests), book, format (`pdf` / `epub`), downloadedAt |
| contactmessages | name, email, subject, message, isRead |

## API

Admin routes need `Authorization: Bearer <token>` of an admin account (`POST /api/auth/login`).

| Area | Endpoint | Who |
|---|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/logout`, `/forgot-password`, `/reset-password/:token`, `PATCH /change-password` | public / user |
| Books | `GET /api/books` — `?search=` `?category=<slug or id>` `?authorId=` `?author=` `?featured=true` `?sort=` `?page=` `?limit=` | public |
| | `GET /api/books/:id`, `GET /api/books/slug/:slug` | public |
| | `GET /api/books/:id/download?format=pdf\|epub` | public (login optional) |
| | `POST /api/books`, `PATCH /api/books/:id`, `DELETE /api/books/:id` | admin |
| Categories | `GET /api/categories`, `/:id`, `/slug/:slug` | public |
| | `POST`, `PATCH /:id`, `DELETE /:id` | admin |
| Authors | `GET /api/authors`, `/:id`, `/slug/:slug` | public |
| | `POST`, `PATCH /:id`, `DELETE /:id` | admin |
| Contact | `POST /api/contact` | public |
| | `GET /api/contact`, `GET /:id`, `PATCH /:id` (`{ "isRead": true }`), `DELETE /:id` | admin |
| Dashboard | `GET /api/admin/dashboard` | admin |
| Downloads | `GET /api/admin/download-stats?days=30&top=10` | admin |
| | `GET /api/downloads` (`?userId=` `?bookId=` `?format=`) | admin |
| | `GET /api/downloads/my`, `GET /api/downloads/library` | user |
| Users | `GET /api/users/me`, `PATCH /api/users/me` | user |
| | `GET /api/users`, `GET /:id`, `PATCH /:id` (`{ "role": "admin" }`), `DELETE /:id` | admin |

### Add / update a book (`multipart/form-data`)

| Field | Notes |
|---|---|
| `title` (or `name`) | required |
| `authorId` **or** `author` | pick an author from `/api/authors`, or type a name |
| `category` | category id, required |
| `description` | required |
| `pdf`, `epub` | files; each optional, **at least one required** when creating |
| `cover` | image (`.jpg`, `.jpeg`, `.png`, `.webp`) |
| `publishedDate`, `language`, `isbn`, `pages`, `isFeatured`, `isActive` | optional |

### Add / update an author (`multipart/form-data`)
`name` (required), `biography`, `profileImage` (image).

## Upload rules

- PDF → `.pdf`, EPUB → `.epub`, images → `.jpg` `.jpeg` `.png` `.webp`.
- The real file **content** is checked (PDF header, EPUB container, JPEG/PNG/WEBP signature), not only the extension.
- Size limits from `.env`: `MAX_EBOOK_MB` (PDF/EPUB, default 100) and `MAX_COVER_MB` (images, default 5).
- Rejected uploads are deleted from disk. Replacing or deleting a book removes its old files.
- PDF and EPUB files are never served as static files; they are only sent by the download route. Covers and author photos are public (`/uploads/covers/...`, `/uploads/authors/...`).

## Security

bcrypt password hashing, JWT login, admin-only routes via `restrictTo("admin")`, helmet, rate limits on login, downloads and the contact form, input validation, secrets in `.env`.
