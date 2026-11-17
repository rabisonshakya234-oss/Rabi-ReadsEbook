const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const Book = require("../models/bookModel");
const Category = require("../models/categoryModel");
const Author = require("../models/authorModel");
const Download = require("../models/downloadModel");
const { ebookPath, coverPath } = require("../middleware/FileHandleMiddleware");
const { findByName, deleteByName } = require("../utils/gridfs");

// Only these fields can be set or changed by the client (slug is generated from the name).
const ALLOWED_FIELDS = [
	"name",
	"author",
	"description",
	"isActive",
	"pages",
	"language",
	"publishedYear",
	"publishedDate",
	"isFeatured",
	"isbn",
	"category",
];

const ALLOWED_SORTS = ["createdAt", "-createdAt", "name", "-name", "downloadCount", "-downloadCount"];

const MIME_TYPES = {
	pdf: "application/pdf",
	epub: "application/epub+zip",
};

const FORMATS = ["pdf", "epub"];

const pickAllowed = (data) => {
	const result = {};
	for (const key of ALLOWED_FIELDS) {
		if (data[key] !== undefined) result[key] = data[key];
	}
	// multipart/form-data sends everything as text
	if (result.isActive !== undefined) result.isActive = String(result.isActive) === "true";
	if (result.isFeatured !== undefined) result.isFeatured = String(result.isFeatured) === "true";
	return result;
};

const checkId = (id) => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid book id");
};

// Make user text safe to use inside a regular expression.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugify = (text) =>
	text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

// "dracula", then "dracula-1", "dracula-2" ... until the slug is free.
async function makeUniqueSlug(name, excludeId) {
	const base = slugify(name) || "book";
	let slug = base;
	let counter = 1;

	while (true) {
		const filter = { slug };
		if (excludeId) filter._id = { $ne: excludeId };
		const taken = await Book.exists(filter);
		if (!taken) return slug;
		slug = `${base}-${counter++}`;
	}
}

async function checkCategory(categoryId) {
	if (!mongoose.Types.ObjectId.isValid(categoryId)) throw new ApiError(400, "Invalid genre id");
	const category = await Category.findById(categoryId);
	if (!category) throw new ApiError(404, "Genre not found");
}

// When the client sends "authorId", link the book to that author and copy the author's name into "author".
async function applyAuthor(authorId, fields) {
	if (!mongoose.Types.ObjectId.isValid(authorId)) throw new ApiError(400, "Invalid author id");
	const author = await Author.findById(authorId);
	if (!author) throw new ApiError(404, "Author not found");
	fields.author = author.name;
	fields.authorRef = author._id;
}

// Files uploaded by multer -> the shape stored in the database.
// Dotted keys ("files.pdf") so that replacing the PDF never wipes the EPUB.
const fileData = (files = {}) => {
	const data = {};
	for (const format of FORMATS) {
		const file = files[format] && files[format][0];
		if (file) {
			data[`files.${format}`] = {
				path: file.filename,
				originalName: file.originalname,
				mimeType: MIME_TYPES[format],
				size: file.size,
			};
		}
	}
	const cover = files.cover && files.cover[0];
	if (cover) data.coverImage = { url: `/uploads/covers/${cover.filename}`, publicId: cover.filename };
	return data;
};

// Deletes a stored file: from the database, and from disk too (for old files saved there before).
const removeFile = (dir, name) => {
	if (!name) return;
	const clean = path.basename(name);
	fs.unlink(path.join(dir, clean), () => {}); // ignore "file missing"
	deleteByName(clean);
};

// If saving fails after files were uploaded, delete them again.
const discardUploads = (files = {}) => {
	for (const f of [...(files.pdf || []), ...(files.epub || []), ...(files.cover || [])]) {
		removeFile(f.fieldname === "cover" ? coverPath : ebookPath, f.filename);
	}
};

async function createBook(data, files) {
	try {
		const fields = pickAllowed(data);

		if (!fields.name || !String(fields.name).trim()) throw new ApiError(400, "Book title is required");
		if (data.authorId) await applyAuthor(data.authorId, fields);
		if (!fields.author || !String(fields.author).trim()) throw new ApiError(400, "Author is required");
		if (!fields.description || !String(fields.description).trim()) throw new ApiError(400, "Book description is required");
		if (!fields.category) throw new ApiError(400, "Genre is required");
		if (!(files && ((files.pdf && files.pdf[0]) || (files.epub && files.epub[0])))) {
			throw new ApiError(400, "Upload at least one file: a PDF or an EPUB");
		}

		await checkCategory(fields.category);

		fields.name = String(fields.name).trim();
		fields.author = String(fields.author).trim();
		fields.slug = await makeUniqueSlug(fields.name);

		return await Book.create({ ...fields, ...fileData(files) });
	} catch (error) {
		discardUploads(files);
		throw error;
	}
}

// Supports search, filters, sort and pagination.
// Example: ?search=dracula&category=<id or slug>&sort=-downloadCount&page=2&limit=10
// Customers only see active books. Pass includeInactive: true for admins.
async function getBooks({
	search,
	category,
	author,
	authorId,
	featured,
	sort = "-createdAt",
	page = 1,
	limit = 12,
	includeInactive = false,
} = {}) {
	const filter = {};

	if (!includeInactive) filter.isActive = true;
	if (search) {
		const rx = { $regex: escapeRegex(search.trim()), $options: "i" };
		filter.$or = [{ name: rx }, { author: rx }, { description: rx }];
	}
	if (String(featured) === "true") filter.isFeatured = true;
	if (authorId) {
		if (!mongoose.Types.ObjectId.isValid(authorId)) throw new ApiError(400, "Invalid author id");
		filter.authorRef = authorId;
	}
	if (author) filter.author = { $regex: escapeRegex(author.trim()), $options: "i" };
	if (category) {
		if (mongoose.Types.ObjectId.isValid(category)) {
			filter.category = category;
		} else {
			// a genre slug such as "sci-fi" or "non-fiction"
			const genre = await Category.findOne({ slug: String(category).toLowerCase() });
			if (!genre) return { books: [], total: 0, page: 1, pages: 0 };
			filter.category = genre._id;
		}
	}

	if (!ALLOWED_SORTS.includes(sort)) sort = "-createdAt";
	page = Math.max(Number(page) || 1, 1);
	limit = Math.min(Math.max(Number(limit) || 12, 1), 100);

	const [books, total] = await Promise.all([
		Book.find(filter)
			.populate("category", "name slug")
			.populate("authorRef", "name slug profileImage")
			.sort(sort)
			.skip((page - 1) * limit)
			.limit(limit),
		Book.countDocuments(filter),
	]);

	return { books, total, page, pages: Math.ceil(total / limit) };
}

async function getBookById(id, { includeInactive = false } = {}) {
	checkId(id);

	const book = await Book.findById(id).populate("category", "name slug").populate("authorRef", "name slug profileImage");
	if (!book || (!book.isActive && !includeInactive)) throw new ApiError(404, "Book not found");

	return book;
}

async function getBookBySlug(slug, { includeInactive = false } = {}) {
	const book = await Book.findOne({ slug }).populate("category", "name slug").populate("authorRef", "name slug profileImage");
	if (!book || (!book.isActive && !includeInactive)) throw new ApiError(404, "Book not found");

	return book;
}

async function updateBook(id, data, files) {
	try {
		checkId(id);

		const fields = pickAllowed(data);
		const newFiles = fileData(files);
		if (Object.keys(fields).length === 0 && Object.keys(newFiles).length === 0 && !data.authorId) throw new ApiError(400, "No valid fields to update");

		if (fields.category) await checkCategory(fields.category);
		if (fields.description !== undefined && !String(fields.description).trim()) throw new ApiError(400, "Book description cannot be empty");
		if (data.authorId) await applyAuthor(data.authorId, fields);
		if (fields.author !== undefined) {
			fields.author = String(fields.author).trim();
			if (!fields.author) throw new ApiError(400, "Author cannot be empty");
		}

		if (fields.name !== undefined) {
			fields.name = String(fields.name).trim();
			if (!fields.name) throw new ApiError(400, "Book title cannot be empty");
			fields.slug = await makeUniqueSlug(fields.name, id);
		}

		const old = await Book.findById(id);
		if (!old) throw new ApiError(404, "Book not found");

		const book = await Book.findByIdAndUpdate(id, { $set: { ...fields, ...newFiles } }, { new: true, runValidators: true });

		// The new files are saved, so the replaced ones can go.
		for (const format of FORMATS) {
			const oldFile = old.files && old.files[format];
			if (newFiles[`files.${format}`] && oldFile) removeFile(ebookPath, oldFile.path);
		}
		if (newFiles.coverImage && old.coverImage) removeFile(coverPath, old.coverImage.publicId);

		return book;
	} catch (error) {
		discardUploads(files);
		throw error;
	}
}

// Deletes the book, its files and its download history.
async function deleteBook(id) {
	checkId(id);

	const book = await Book.findById(id);
	if (!book) throw new ApiError(404, "Book not found");

	await Book.findByIdAndDelete(id);
	await Download.deleteMany({ book: id });
	for (const format of FORMATS) {
		if (book.files && book.files[format]) removeFile(ebookPath, book.files[format].path);
	}
	if (book.coverImage) removeFile(coverPath, book.coverImage.publicId);
}

// Finds the file to send and checks that it exists (in the database, or on disk for old files).
// "format" is "pdf" or "epub". When it is left out, the PDF is used if the book has one, otherwise the EPUB.
async function getDownloadFile(id, format) {
	checkId(id);

	const book = await Book.findById(id);
	if (!book || !book.isActive) throw new ApiError(404, "Book not found");

	if (format !== undefined && !FORMATS.includes(format)) throw new ApiError(400, "format must be pdf or epub");
	const has = (f) => book.files && book.files[f] && book.files[f].path;
	if (!format) format = FORMATS.find(has);
	if (!format || !has(format)) {
		throw new ApiError(404, format ? `This book has no ${format.toUpperCase()} file` : "This book has no file yet");
	}

	const stored = path.basename(book.files[format].path);
	const downloadName = `${slugify(book.name) || "book"}.${format}`;
	const mimeType = book.files[format].mimeType;

	// old files that were saved on disk
	const filePath = path.join(ebookPath, stored);
	if (fs.existsSync(filePath)) return { filePath, downloadName, mimeType, book, format };

	// files saved in the database (GridFS)
	const file = await findByName(stored);
	if (!file) throw new ApiError(404, "The book file is missing on the server");
	return { fileId: file._id, length: file.length, downloadName, mimeType, book, format };
}

// Called after the file is found: bumps the counter and saves a history entry.
// userId is empty for guests.
async function countDownload(book, userId, format) {
	await Promise.all([
		Book.findByIdAndUpdate(book._id, { $inc: { downloadCount: 1 } }),
		Download.create({ user: userId || undefined, book: book._id, format, nameAtDownload: book.name, authorAtDownload: book.author }),
	]);
}

module.exports = {
	createBook,
	getBooks,
	getBookById,
	getBookBySlug,
	updateBook,
	deleteBook,
	getDownloadFile,
	countDownload,
};