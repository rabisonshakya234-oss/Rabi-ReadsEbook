const mongoose = require("mongoose");

// A "book" in this library is an ebook. Every book is free to download.
const bookSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
		},
		author: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			default: "",
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isFeatured: {
			type: Boolean,
			default: false,
		},
		pages: {
			type: Number,
			min: 0,
			default: 0,
		},
		language: {
			type: String,
			default: "English",
		},
		publishedYear: {
			type: Number,
		},
		publishedDate: {
			type: Date,
		},
		isbn: {
			type: String,
			default: "",
		},
		downloadCount: {
			type: Number,
			default: 0,
		},
		// "author" keeps the author's name as text; "authorRef" links to the Author collection.
		authorRef: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Author",
		},
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
		},
		coverImage: {
			url: String,
			publicId: String, // file name on disk
		},
		// The downloadable files. Both are optional, but a book needs at least one.
		// "path" is private and never sent to clients.
		files: {
			pdf: {
				path: String,
				originalName: String,
				mimeType: String,
				size: Number,
			},
			epub: {
				path: String,
				originalName: String,
				mimeType: String,
				size: Number,
			},
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform(doc, ret) {
				const files = ret.files || {};
				if (files.pdf) delete files.pdf.path;
				if (files.epub) delete files.epub.path;
				ret.hasPdf = Boolean(files.pdf && files.pdf.originalName);
				ret.hasEpub = Boolean(files.epub && files.epub.originalName);
				ret.hasFile = ret.hasPdf || ret.hasEpub;
				ret.title = ret.name; // same value as "name"
				return ret;
			},
		},
	},
);

bookSchema.index({ name: "text", author: "text" });
bookSchema.index({ authorRef: 1 });

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
