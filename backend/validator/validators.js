// Simple request validation. Each validator collects problems and
// either calls next() (all good) or sends a 400 error listing them.
const fs = require("fs");
const { deleteById } = require("../utils/gridfs");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");

const isText = (value) => typeof value === "string" && value.trim() !== "";
const isEmail = (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isUsername = (value) => typeof value === "string" && /^[a-zA-Z0-9_.-]{3,30}$/.test(value.trim());
// Book forms are sent as multipart/form-data, so numbers arrive as text ("432").
const toNumber = (value) => (typeof value === "string" && value.trim() !== "" ? Number(value) : value);
const isWholeNumber = (value, min, max) => {
	const n = toNumber(value);
	return Number.isInteger(n) && n >= min && n <= max;
};
const isBoolish = (value) => [true, false, "true", "false"].includes(value);

// bcrypt only reads the first 72 bytes of a password.
const passwordProblem = (value, field) => {
	if (typeof value !== "string" || value.length < 8) return `${field} must be at least 8 characters`;
	if (Buffer.byteLength(value) > 72) return `${field} is too long (max 72 bytes)`;
	if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return `${field} needs a letter and a number`;
	return null;
};

// Wraps a function that returns a list of errors into Express middleware.
const check = (findErrors) => (req, res, next) => {
	const errors = findErrors(req);
	if (errors.length > 0) {
		// multer already saved any uploaded files (in the database), so remove them when the request is rejected
		for (const list of Object.values(req.files || {})) list.forEach((file) => deleteById(file.id));
		return next(new ApiError(400, "Validation failed", errors));
	}
	next();
};

const add = (errors, field, message) => errors.push({ field, message });

/* ---------- Auth ---------- */

const register = check((req) => {
	const { username, email, password, confirmPassword } = req.body;
	const errors = [];
	if (!isUsername(username)) add(errors, "username", "Username must be 3-30 characters (letters, numbers, _ . -)");
	if (!isEmail(email)) add(errors, "email", "A valid email is required");
	const problem = passwordProblem(password, "password");
	if (problem) add(errors, "password", problem);
	if (!isText(confirmPassword)) add(errors, "confirmPassword", "confirmPassword is required");
	return errors;
});

const login = check((req) => {
	const errors = [];
	if (!isEmail(req.body.email)) add(errors, "email", "A valid email is required");
	if (!isText(req.body.password)) add(errors, "password", "password is required");
	return errors;
});

const forgotPassword = check((req) => (isEmail(req.body.email) ? [] : [{ field: "email", message: "A valid email is required" }]));

const resetPassword = check((req) => {
	const errors = [];
	const problem = passwordProblem(req.body.password, "password");
	if (problem) add(errors, "password", problem);
	if (!isText(req.body.confirmPassword)) add(errors, "confirmPassword", "confirmPassword is required");
	return errors;
});

const changePassword = check((req) => {
	const { currentPassword, newPassword, confirmPassword } = req.body;
	const errors = [];
	if (!isText(currentPassword)) add(errors, "currentPassword", "currentPassword is required");
	const problem = passwordProblem(newPassword, "newPassword");
	if (problem) add(errors, "newPassword", problem);
	if (!isText(confirmPassword)) add(errors, "confirmPassword", "confirmPassword is required");
	return errors;
});

const updateProfile = check((req) =>
	isUsername(req.body.username) ? [] : [{ field: "username", message: "Username must be 3-30 characters (letters, numbers, _ . -)" }],
);

const listUsers = check((req) => {
	const q = req.query;
	const errors = [];
	const page = q.page === undefined ? 1 : Number(q.page);
	const limit = q.limit === undefined ? 20 : Number(q.limit);
	if (!Number.isInteger(page) || page < 1) add(errors, "page", "page must be 1 or more");
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) add(errors, "limit", "limit must be between 1 and 100");
	return errors;
});

/* ---------- Books (ebooks) ---------- */

const checkBookFields = (body, errors, isUpdate) => {
	const { name, author, authorId, description, category, isActive, isFeatured, pages, language, publishedYear, publishedDate, isbn } = body;

	if (!isUpdate || name !== undefined) {
		if (!isText(name) || name.length > 150) add(errors, "name", "name (book title) is required (max 150 characters)");
	}
	if (authorId !== undefined && !mongoose.isValidObjectId(authorId)) add(errors, "authorId", "authorId must be a valid author id");
	// Send either authorId (an author from the Authors list) or author (plain text).
	if ((!isUpdate && !authorId) || (isUpdate && author !== undefined)) {
		if (!isText(author) || author.length > 100) add(errors, "author", "author (or authorId) is required (max 100 characters)");
	}
	if (!isUpdate || description !== undefined) {
		if (!isText(description) || description.length > 5000) add(errors, "description", "description is required (max 5000 characters)");
	}
	if (!isUpdate || category !== undefined) {
		if (!mongoose.isValidObjectId(category)) add(errors, "category", "category must be a valid genre id");
	}
	if (pages !== undefined && !isWholeNumber(pages, 0, 100000)) add(errors, "pages", "pages must be a whole number of 0 or more");
	if (publishedYear !== undefined && !isWholeNumber(publishedYear, 0, 3000)) add(errors, "publishedYear", "publishedYear must be a valid year");
	if (language !== undefined && (typeof language !== "string" || language.length > 40)) add(errors, "language", "language must be text (max 40 characters)");
	if (isbn !== undefined && (typeof isbn !== "string" || isbn.length > 20)) add(errors, "isbn", "isbn must be text (max 20 characters)");
	if (publishedDate !== undefined && (typeof publishedDate !== "string" || Number.isNaN(Date.parse(publishedDate)))) {
		add(errors, "publishedDate", "publishedDate must be a valid date (for example 2024-05-31)");
	}
	if (isActive !== undefined && !isBoolish(isActive)) add(errors, "isActive", "isActive must be true or false");
	if (isFeatured !== undefined && !isBoolish(isFeatured)) add(errors, "isFeatured", "isFeatured must be true or false");
};

const createBook = check((req) => {
	const errors = [];
	checkBookFields(req.body, errors, false);
	const files = req.files || {};
	if (!files.pdf && !files.epub) add(errors, "files", "Upload at least one file: pdf and/or epub");
	return errors;
});

const updateBook = check((req) => {
	const fields = ["name", "author", "authorId", "description", "category", "isActive", "isFeatured", "pages", "language", "publishedYear", "publishedDate", "isbn"];
	const hasFile = req.files && (req.files.pdf || req.files.epub || req.files.cover);
	if (!hasFile && !fields.some((f) => req.body[f] !== undefined)) {
		return [{ field: "body", message: `Send at least one of: ${fields.join(", ")}, or a pdf / epub / cover file` }];
	}
	const errors = [];
	checkBookFields(req.body, errors, true);
	return errors;
});

const bookId = check((req) => (mongoose.isValidObjectId(req.params.id) ? [] : [{ field: "id", message: "Invalid book id" }]));

const listBooks = check((req) => {
	const q = req.query;
	const errors = [];

	const page = q.page === undefined ? 1 : Number(q.page);
	const limit = q.limit === undefined ? 12 : Number(q.limit);
	if (!Number.isInteger(page) || page < 1) add(errors, "page", "page must be 1 or more");
	if (!Number.isInteger(limit) || limit < 1 || limit > 50) add(errors, "limit", "limit must be between 1 and 50");

	if (q.sort !== undefined && !["createdAt", "-createdAt", "name", "-name", "downloadCount", "-downloadCount"].includes(q.sort)) {
		add(errors, "sort", "sort must be createdAt, -createdAt, name, -name, downloadCount or -downloadCount");
	}

	if (q.search !== undefined && (typeof q.search !== "string" || q.search.length > 100)) {
		add(errors, "search", "search must be text up to 100 characters");
	}
	if (q.category !== undefined && typeof q.category !== "string") add(errors, "category", "category must be a genre slug or id (text)");
	if (q.author !== undefined && (typeof q.author !== "string" || q.author.length > 100)) add(errors, "author", "author must be text up to 100 characters");
	if (q.authorId !== undefined && !mongoose.isValidObjectId(q.authorId)) add(errors, "authorId", "authorId must be a valid author id");
	if (q.featured !== undefined && !["true", "false"].includes(q.featured)) add(errors, "featured", "featured must be true or false");
	return errors;
});

/* ---------- Categories (genres) ---------- */

const checkCategoryFields = (body, errors, isUpdate) => {
	const { name, description } = body;
	if (!isUpdate || name !== undefined) {
		if (!isText(name) || name.length > 60) add(errors, "name", "name is required (max 60 characters)");
	}
	if (description !== undefined && (typeof description !== "string" || description.length > 500)) {
		add(errors, "description", "description must be text (max 500 characters)");
	}
};

const createCategory = check((req) => {
	const errors = [];
	checkCategoryFields(req.body, errors);
	return errors;
});

const updateCategory = check((req) => {
	if (req.body.name === undefined && req.body.description === undefined) {
		return [{ field: "body", message: "Send name and/or description" }];
	}
	const errors = [];
	checkCategoryFields(req.body, errors, true);
	return errors;
});

const categoryId = check((req) => (mongoose.isValidObjectId(req.params.id) ? [] : [{ field: "id", message: "Invalid genre id" }]));

/* ---------- Downloads ---------- */

const listDownloads = check((req) => {
	const q = req.query;
	const errors = [];

	const page = q.page === undefined ? 1 : Number(q.page);
	const limit = q.limit === undefined ? 20 : Number(q.limit);
	if (!Number.isInteger(page) || page < 1) add(errors, "page", "page must be 1 or more");
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) add(errors, "limit", "limit must be between 1 and 100");

	if (q.userId !== undefined && !mongoose.isValidObjectId(q.userId)) add(errors, "userId", "userId must be a valid user id");
	if (q.bookId !== undefined && !mongoose.isValidObjectId(q.bookId)) add(errors, "bookId", "bookId must be a valid book id");
	if (q.format !== undefined && !["pdf", "epub"].includes(q.format)) add(errors, "format", "format must be pdf or epub");
	return errors;
});

/* ---------- Authors ---------- */

const checkAuthorFields = (body, errors, isUpdate) => {
	const { name, biography } = body;
	if (!isUpdate || name !== undefined) {
		if (!isText(name) || name.length > 100) add(errors, "name", "name is required (max 100 characters)");
	}
	if (biography !== undefined && (typeof biography !== "string" || biography.length > 5000)) {
		add(errors, "biography", "biography must be text (max 5000 characters)");
	}
};

const createAuthor = check((req) => {
	const errors = [];
	checkAuthorFields(req.body, errors, false);
	return errors;
});

const updateAuthor = check((req) => {
	const hasFile = req.files && req.files.profileImage;
	if (!hasFile && req.body.name === undefined && req.body.biography === undefined) {
		return [{ field: "body", message: "Send name and/or biography, or a profileImage file" }];
	}
	const errors = [];
	checkAuthorFields(req.body, errors, true);
	return errors;
});

const authorId = check((req) => (mongoose.isValidObjectId(req.params.id) ? [] : [{ field: "id", message: "Invalid author id" }]));

const listAuthors = check((req) => {
	const q = req.query;
	const errors = [];
	const page = q.page === undefined ? 1 : Number(q.page);
	const limit = q.limit === undefined ? 20 : Number(q.limit);
	if (!Number.isInteger(page) || page < 1) add(errors, "page", "page must be 1 or more");
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) add(errors, "limit", "limit must be between 1 and 100");
	if (q.search !== undefined && (typeof q.search !== "string" || q.search.length > 100)) add(errors, "search", "search must be text up to 100 characters");
	return errors;
});

/* ---------- Contact messages ---------- */

const createContact = check((req) => {
	const { name, email, subject, message } = req.body;
	const errors = [];
	if (!isText(name) || name.length > 100) add(errors, "name", "name is required (max 100 characters)");
	if (!isEmail(email) || email.length > 150) add(errors, "email", "A valid email is required");
	if (subject !== undefined && (typeof subject !== "string" || subject.length > 150)) add(errors, "subject", "subject must be text (max 150 characters)");
	if (!isText(message) || message.length < 10 || message.length > 3000) add(errors, "message", "message is required (10-3000 characters)");
	return errors;
});

const contactId = check((req) => (mongoose.isValidObjectId(req.params.id) ? [] : [{ field: "id", message: "Invalid message id" }]));

const updateContact = check((req) => (isBoolish(req.body.isRead) ? [] : [{ field: "isRead", message: "isRead must be true or false" }]));

const listContacts = check((req) => {
	const q = req.query;
	const errors = [];
	const page = q.page === undefined ? 1 : Number(q.page);
	const limit = q.limit === undefined ? 20 : Number(q.limit);
	if (!Number.isInteger(page) || page < 1) add(errors, "page", "page must be 1 or more");
	if (!Number.isInteger(limit) || limit < 1 || limit > 100) add(errors, "limit", "limit must be between 1 and 100");
	if (q.isRead !== undefined && !["true", "false"].includes(q.isRead)) add(errors, "isRead", "isRead must be true or false");
	return errors;
});

/* ---------- Admin: users and statistics ---------- */

const userId = check((req) => (mongoose.isValidObjectId(req.params.id) ? [] : [{ field: "id", message: "Invalid user id" }]));

const updateUser = check((req) => (["user", "admin"].includes(req.body.role) ? [] : [{ field: "role", message: "role must be user or admin" }]));

const downloadStats = check((req) => {
	const q = req.query;
	const errors = [];
	if (q.days !== undefined && !isWholeNumber(q.days, 1, 365)) add(errors, "days", "days must be between 1 and 365");
	if (q.top !== undefined && !isWholeNumber(q.top, 1, 50)) add(errors, "top", "top must be between 1 and 50");
	return errors;
});

module.exports = {
	register,
	login,
	forgotPassword,
	resetPassword,
	changePassword,
	updateProfile,
	listUsers,
	createBook,
	updateBook,
	bookId,
	listBooks,
	createCategory,
	updateCategory,
	categoryId,
	listDownloads,
	createAuthor,
	updateAuthor,
	authorId,
	listAuthors,
	createContact,
	contactId,
	updateContact,
	listContacts,
	userId,
	updateUser,
	downloadStats,
};