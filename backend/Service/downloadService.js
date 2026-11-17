const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const Download = require("../models/downloadModel");
const Book = require("../models/bookModel");

const paging = ({ page = 1, limit = 20 } = {}) => {
	page = Math.max(Number(page) || 1, 1);
	limit = Math.min(Math.max(Number(limit) || 20, 1), 100);
	return { page, limit };
};

// "My downloads": every download of the logged-in user, newest first.
async function getMyDownloads(userId, query = {}) {
	const { page, limit } = paging(query);
	const filter = { user: userId };

	const [downloads, total] = await Promise.all([
		Download.find(filter)
			.populate("book", "name slug author coverImage")
			.sort("-createdAt")
			.skip((page - 1) * limit)
			.limit(limit),
		Download.countDocuments(filter),
	]);

	return { downloads, total, page, pages: Math.ceil(total / limit) };
}

// "My library": the distinct books the user has downloaded (still available ones).
async function getMyLibrary(userId) {
	const ids = await Download.distinct("book", { user: userId });
	const books = await Book.find({ _id: { $in: ids }, isActive: true }).populate("category", "name slug").sort("name");
	return { books, total: books.length };
}

// Admin: all downloads, optionally for one user or one book.
async function getAllDownloads({ userId, bookId, format, page = 1, limit = 20 } = {}) {
	const paged = paging({ page, limit });
	const filter = {};
	if (userId) {
		if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid user id");
		filter.user = userId;
	}
	if (bookId) {
		if (!mongoose.Types.ObjectId.isValid(bookId)) throw new ApiError(400, "Invalid book id");
		filter.book = bookId;
	}

	if (format) filter.format = format;

	const [downloads, total] = await Promise.all([
		Download.find(filter)
			.populate("user", "username email")
			.populate("book", "name slug author")
			.sort("-createdAt")
			.skip((paged.page - 1) * paged.limit)
			.limit(paged.limit),
		Download.countDocuments(filter),
	]);

	return { downloads, total, page: paged.page, pages: Math.ceil(total / paged.limit) };
}

module.exports = { getMyDownloads, getMyLibrary, getAllDownloads };
