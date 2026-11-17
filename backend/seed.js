// Usage:
//   npm run seed                  -> admin + the 6 genres + authors + sample books (safe to re-run)
//   npm run seed -- --admin-only  -> only the admin account (use this on production)
//   npm run seed -- --fresh       -> wipes genres, authors, books and download history first (development only)
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config/env');

const User = require('./models/userModel');
const Category = require('./models/categoryModel');
const Author = require('./models/authorModel');
const Book = require('./models/bookModel');
const Download = require('./models/downloadModel');
const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const args = process.argv.slice(2);
const ADMIN_ONLY = args.includes('--admin-only');
const FRESH = args.includes('--fresh');

/* ---------- Sample data ---------- */

// The six sections of the library.
const categories = ['Fiction', 'Non-Fiction', 'Sci-Fi', 'Thriller', 'Horror', 'Comedy'];

// Classic public-domain titles. All books are free to download.
// "category" is the genre name from the list above.
const books = [
  { name: 'Pride and Prejudice', author: 'Jane Austen', category: 'Fiction', pages: 432, publishedYear: 1813,
    description: 'Elizabeth Bennet and Mr. Darcy navigate pride, class and first impressions in Regency England.' },
  { name: 'Great Expectations', author: 'Charles Dickens', category: 'Fiction', pages: 505, publishedYear: 1861,
    description: 'The orphan Pip rises from a village forge to London society, and learns what really matters.' },
  { name: 'Walden', author: 'Henry David Thoreau', category: 'Non-Fiction', pages: 352, publishedYear: 1854,
    description: 'Two years in a cabin by Walden Pond: a classic essay on simple living and nature.' },
  { name: 'The Art of War', author: 'Sun Tzu', category: 'Non-Fiction', pages: 128, publishedYear: -500,
    description: 'Ancient Chinese strategy on conflict, leadership and winning without fighting.' },
  { name: 'The Time Machine', author: 'H. G. Wells', category: 'Sci-Fi', pages: 118, publishedYear: 1895,
    description: 'A Victorian inventor travels to the year 802,701 and finds a divided humanity.' },
  { name: 'Twenty Thousand Leagues Under the Seas', author: 'Jules Verne', category: 'Sci-Fi', pages: 426, publishedYear: 1870,
    description: 'Captain Nemo and the Nautilus take a professor on an underwater voyage around the world.' },
  { name: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', category: 'Thriller', pages: 256, publishedYear: 1902,
    description: 'Sherlock Holmes investigates a spectral hound haunting the Baskerville family on the moors.' },
  { name: 'The Thirty-Nine Steps', author: 'John Buchan', category: 'Thriller', pages: 128, publishedYear: 1915,
    description: 'Richard Hannay is hunted across Scotland after learning of a plot to start a war.' },
  { name: 'Dracula', author: 'Bram Stoker', category: 'Horror', pages: 418, publishedYear: 1897,
    description: 'Jonathan Harker travels to Transylvania and unleashes the most famous vampire of all.' },
  { name: 'Frankenstein', author: 'Mary Shelley', category: 'Horror', pages: 280, publishedYear: 1818,
    description: 'Victor Frankenstein creates life, and is haunted by what he has made.' },
  { name: 'Three Men in a Boat', author: 'Jerome K. Jerome', category: 'Comedy', pages: 256, publishedYear: 1889,
    description: 'Three friends and a dog take a disastrous, hilarious boating holiday up the Thames.' },
  { name: 'The Importance of Being Earnest', author: 'Oscar Wilde', category: 'Comedy', pages: 96, publishedYear: 1895,
    description: 'A witty comedy of mistaken identities, double lives and a very large handbag.' },
];

/* ---------- Seed steps ---------- */

const seedAdmin = async () => {
  const { ADMIN_USERNAME = 'bookowner', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('Admin: skipped (add ADMIN_EMAIL and ADMIN_PASSWORD to .env to create one)');
    return;
  }
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    // Never change the password of an existing account, only make sure it is an admin
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Admin: existing user promoted to admin (${email})`);
    } else {
      console.log(`Admin: already exists (${email})`);
    }
    return;
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, config.saltRounds);
  await User.create({
    username: ADMIN_USERNAME,
    email,
    password: hashed,
    confirmPassword: hashed, // your user model requires this field
    role: 'admin',
  });
  console.log(`Admin: created (${email})`);
};

const seedCategories = async () => {
  const byName = {};
  let created = 0;

  for (const name of categories) {
    const slug = slugify(name);
    let category = await Category.findOne({ slug });
    if (!category) {
      category = await Category.create({ name, slug });
      created++;
    }
    byName[name] = category._id;
  }
  console.log(`Genres: ${created} created, ${categories.length - created} already existed`);
  return byName;
};

// Each sample book gets a tiny one-page PDF so downloads work right away.
// Replace it from the admin side by uploading the real PDF / EPUB (PATCH /api/books/:id).
const makeSamplePdf = (item) => {
  const clean = (text) => String(text).replace(/[^\x20-\x7E]/g, '').replace(/([\\()])/g, '\\$1');
  const lines = [item.name, `by ${item.author}`, '', 'Sample file created by "npm run seed".', 'Upload the real PDF or EPUB from the admin side.'];
  const stream = `BT /F1 18 Tf 72 720 Td 24 TL ${lines.map((line) => `(${clean(line)}) Tj T*`).join(' ')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefAt = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return pdf;
};

const makeSampleFile = (item, slug) => {
  const dir = path.join(__dirname, 'uploads', 'ebooks');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `sample-${slug}.pdf`;
  const pdf = makeSamplePdf(item);
  fs.writeFileSync(path.join(dir, filename), pdf);
  return { path: filename, originalName: `${slug}.pdf`, mimeType: 'application/pdf', size: Buffer.byteLength(pdf) };
};

// One Author for every writer in the book list.
const seedAuthors = async () => {
  const byName = {};
  let created = 0;
  const names = [...new Set(books.map((book) => book.author))];

  for (const name of names) {
    const slug = slugify(name);
    let author = await Author.findOne({ slug });
    if (!author) {
      author = await Author.create({ name, slug, biography: '' });
      created++;
    }
    byName[name] = author;
  }
  console.log(`Authors: ${created} created, ${names.length - created} already existed`);
  return byName;
};

const seedBooks = async (categoryIds, authorsByName) => {
  let created = 0;

  for (const [index, item] of books.entries()) {
    const slug = slugify(item.name);
    // Skip if it exists, so re-running never resets what you have changed
    if (await Book.exists({ slug })) continue;

    await Book.create({
      ...item,
      slug,
      category: categoryIds[item.category],
      authorRef: authorsByName[item.author]._id,
      isFeatured: index < 6, // the first six books show as "featured" on the home page
      files: { pdf: makeSampleFile(item, slug) },
    });
    created++;
  }
  console.log(`Books: ${created} created, ${books.length - created} already existed`);
};

/* ---------- Run ---------- */

const run = async () => {
  if (FRESH && config.isProduction) {
    throw new Error('--fresh is blocked when NODE_ENV=production');
  }

  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');

  if (FRESH) {
    await Promise.all([Download.deleteMany({}), Book.deleteMany({}), Category.deleteMany({}), Author.deleteMany({})]);
    console.log('Cleared: downloads, books, genres, authors');
  }

  await seedAdmin();

  if (!ADMIN_ONLY) {
    const categoryIds = await seedCategories();
    const authorsByName = await seedAuthors();
    await seedBooks(categoryIds, authorsByName);
  }

  console.log('Seeding finished');
};

run()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
