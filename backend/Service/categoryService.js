const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const Category = require("../models/categoryModel");
const Book = require("../models/bookModel");

// A "category" is a book genre/section: Fiction, Non-Fiction, Sci-Fi, Thriller, Horror, Comedy.

const checkId = (id) => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid genre id");
};

// Make user text safe to use inside a regular expression.
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugify = (text) =>
	text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

// "horror", then "horror-1", "horror-2" ... until the slug is free.
async function makeUniqueSlug(name, excludeId) {
	const base = slugify(name) || "genre";
	let slug = base;
	let counter = 1;

	while (true) {
		const filter = { slug };
		if (excludeId) filter._id = { $ne: excludeId };
		const taken = await Category.exists(filter);
		if (!taken) return slug;
		slug = `${base}-${counter++}`;
	}
}

// Case-insensitive exact match, so "Horror" and "horror" count as the same name.
async function findByName(name, excludeId) {
	const filter = { name: new RegExp(`^${escapeRegex(name)}$`, "i") };
	if (excludeId) filter._id = { $ne: excludeId };
	return Category.findOne(filter);
}

async function createCategory({ name, description } = {}) {
	if (!name || !String(name).trim()) throw new ApiError(400, "Genre name is required");

	name = String(name).trim();

	const exists = await findByName(name);
	if (exists) throw new ApiError(409, "A genre with this name already exists");

	return Category.create({ name, slug: await makeUniqueSlug(name), description: description ? String(description).trim() : "" });
}

// Supports search and pagination. Each genre also reports how many active books it has.
async function getCategories({ search, page = 1, limit = 50 } = {}) {
	const filter = {};
	if (search) filter.name = { $regex: escapeRegex(String(search).trim()), $options: "i" };

	page = Math.max(Number(page) || 1, 1);
	limit = Math.min(Math.max(Number(limit) || 50, 1), 100);

	const [found, total] = await Promise.all([
		Category.find(filter)
			.sort("name")
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
		Category.countDocuments(filter),
	]);

	const counts = await Book.aggregate([
		{ $match: { isActive: true, category: { $in: found.map((c) => c._id) } } },
		{ $group: { _id: "$category", count: { $sum: 1 } } },
	]);
	const countById = new Map(counts.map((c) => [String(c._id), c.count]));
	const categories = found.map((c) => ({ ...c, bookCount: countById.get(String(c._id)) || 0 }));

	return { categories, total, page, pages: Math.ceil(total / limit) };
}

async function getCategoryById(id) {
	checkId(id);

	const category = await Category.findById(id);
	if (!category) throw new ApiError(404, "Genre not found");

	return category;
}

async function getCategoryBySlug(slug) {
	const category = await Category.findOne({ slug });
	if (!category) throw new ApiError(404, "Genre not found");

	return category;
}

// Renaming also regenerates the slug. Send name and/or description.
async function updateCategory(id, { name, description } = {}) {
	checkId(id);

	if (name === undefined && description === undefined) throw new ApiError(400, "Send name and/or description");

	const changes = {};
	if (name !== undefined) {
		if (!String(name).trim()) throw new ApiError(400, "Genre name is required");

		name = String(name).trim();

		const duplicate = await findByName(name, id);
		if (duplicate) throw new ApiError(409, "A genre with this name already exists");

		changes.name = name;
		changes.slug = await makeUniqueSlug(name, id);
	}
	if (description !== undefined) changes.description = String(description).trim();

	const category = await Category.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true });
	if (!category) throw new ApiError(404, "Genre not found");

	return category;
}

// A genre that still has books cannot be deleted.
async function deleteCategory(id) {
	checkId(id);

	const category = await Category.findById(id);
	if (!category) throw new ApiError(404, "Genre not found");

	const bookCount = await Book.countDocuments({ category: id });
	if (bookCount > 0) throw new ApiError(400, `Cannot delete: ${bookCount} book(s) still use this genre`);

	await Category.findByIdAndDelete(id);
}

module.exports = {
	createCategory,
	getCategories,
	getCategoryById,
	getCategoryBySlug,
	updateCategory,
	deleteCategory,
};
