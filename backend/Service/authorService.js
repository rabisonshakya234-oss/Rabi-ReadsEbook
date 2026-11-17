const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const Author = require("../models/authorModel");
const Book = require("../models/bookModel");
const { authorPath } = require("../middleware/FileHandleMiddleware");
const { deleteByName } = require("../utils/gridfs");

// An "author" is a book writer with a biography and a profile photo.

const checkId = (id) => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid author id");
};

// Make user text safe to use inside a regular expression.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugify = (text) =>
	text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

// "jane-austen", then "jane-austen-1", "jane-austen-2" ... until the slug is free.
async function makeUniqueSlug(name, excludeId) {
	const base = slugify(name) || "author";
	let slug = base;
	let counter = 1;

	while (true) {
		const filter = { slug };
		if (excludeId) filter._id = { $ne: excludeId };
		const taken = await Author.exists(filter);
		if (!taken) return slug;
		slug = `${base}-${counter++}`;
	}
}

// Case-insensitive exact match, so "Jane Austen" and "jane austen" count as the same name.
async function findByName(name, excludeId) {
	const filter = { name: new RegExp(`^${escapeRegex(name)}$`, "i") };
	if (excludeId) filter._id = { $ne: excludeId };
	return Author.findOne(filter);
}

// Deletes a stored photo: from the database, and from disk too (for old photos saved there before).
const removeFile = (name) => {
	if (!name) return;
	const clean = path.basename(name);
	fs.unlink(path.join(authorPath, clean), () => {}); // ignore "file missing"
	deleteByName(clean);
};

// If saving fails after the photo was uploaded, delete it again.
const discardUploads = (files = {}) => {
	for (const f of files.profileImage || []) removeFile(f.filename);
};

const imageData = (files = {}) => {
	const image = files.profileImage && files.profileImage[0];
	return image ? { url: `/uploads/authors/${image.filename}`, publicId: image.filename } : null;
};

async function createAuthor({ name, biography } = {}, files) {
	try {
		if (!name || !String(name).trim()) throw new ApiError(400, "Author name is required");

		name = String(name).trim();

		const exists = await findByName(name);
		if (exists) throw new ApiError(409, "An author with this name already exists");

		const data = { name, slug: await makeUniqueSlug(name), biography: biography ? String(biography).trim() : "" };
		const profileImage = imageData(files);
		if (profileImage) data.profileImage = profileImage;

		return await Author.create(data);
	} catch (error) {
		discardUploads(files);
		throw error;
	}
}

// Supports search and pagination. Each author also reports how many active books they have.
async function getAuthors({ search, page = 1, limit = 20 } = {}) {
	const filter = {};
	if (search) filter.name = { $regex: escapeRegex(String(search).trim()), $options: "i" };

	page = Math.max(Number(page) || 1, 1);
	limit = Math.min(Math.max(Number(limit) || 20, 1), 100);

	const [found, total] = await Promise.all([
		Author.find(filter)
			.sort("name")
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
		Author.countDocuments(filter),
	]);

	const counts = await Book.aggregate([
		{ $match: { isActive: true, authorRef: { $in: found.map((a) => a._id) } } },
		{ $group: { _id: "$authorRef", count: { $sum: 1 } } },
	]);
	const countById = new Map(counts.map((c) => [String(c._id), c.count]));
	const authors = found.map((a) => ({ ...a, bookCount: countById.get(String(a._id)) || 0 }));

	return { authors, total, page, pages: Math.ceil(total / limit) };
}

async function getAuthorById(id) {
	checkId(id);

	const author = await Author.findById(id);
	if (!author) throw new ApiError(404, "Author not found");

	return author;
}

async function getAuthorBySlug(slug) {
	const author = await Author.findOne({ slug });
	if (!author) throw new ApiError(404, "Author not found");

	return author;
}

// Renaming also regenerates the slug and updates the author's name on their books.
async function updateAuthor(id, { name, biography } = {}, files) {
	try {
		checkId(id);

		const newImage = imageData(files);
		if (name === undefined && biography === undefined && !newImage) throw new ApiError(400, "No valid fields to update");

		const old = await Author.findById(id);
		if (!old) throw new ApiError(404, "Author not found");

		const changes = {};
		if (name !== undefined) {
			name = String(name).trim();
			if (!name) throw new ApiError(400, "Author name is required");

			const duplicate = await findByName(name, id);
			if (duplicate) throw new ApiError(409, "An author with this name already exists");

			changes.name = name;
			changes.slug = await makeUniqueSlug(name, id);
		}
		if (biography !== undefined) changes.biography = String(biography).trim();
		if (newImage) changes.profileImage = newImage;

		const author = await Author.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true });

		if (changes.name) await Book.updateMany({ authorRef: id }, { $set: { author: changes.name } });
		// The new photo is saved, so the replaced one can go.
		if (newImage && old.profileImage) removeFile(old.profileImage.publicId);

		return author;
	} catch (error) {
		discardUploads(files);
		throw error;
	}
}

// An author that still has books cannot be deleted.
async function deleteAuthor(id) {
	checkId(id);

	const author = await Author.findById(id);
	if (!author) throw new ApiError(404, "Author not found");

	const bookCount = await Book.countDocuments({ authorRef: id });
	if (bookCount > 0) throw new ApiError(400, `Cannot delete: ${bookCount} book(s) still use this author`);

	await Author.findByIdAndDelete(id);
	if (author.profileImage) removeFile(author.profileImage.publicId);
}

module.exports = {
	createAuthor,
	getAuthors,
	getAuthorById,
	getAuthorBySlug,
	updateAuthor,
	deleteAuthor,
};