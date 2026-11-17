const path = require("path"); // works with files and directory.
const fs = require("fs");
const multer = require("multer");
const config = require("../config/env");
const ApiError = require("../utils/ApiError");
const { getBucket, deleteById } = require("../utils/gridfs");

// Uploaded files are saved in MongoDB (GridFS), so they survive restarts on hosts with a temporary disk
// (for example Render's free plan). Covers and author photos are public images. PDF / EPUB files are
// private (served only through the protected download route).
// These folders are only used for OLD files that were saved on disk before (and by seed.js).
const coverPath = path.join(__dirname, "..", "uploads", "covers");
const ebookPath = path.join(__dirname, "..", "uploads", "ebooks");
const authorPath = path.join(__dirname, "..", "uploads", "authors");

fs.mkdirSync(coverPath, { recursive: true });
fs.mkdirSync(ebookPath, { recursive: true });
fs.mkdirSync(authorPath, { recursive: true });

const COVER_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// Which file extensions each upload field accepts.
const ALLOWED_EXTENSIONS = {
	pdf: [".pdf"],
	epub: [".epub"],
	cover: COVER_EXTENSIONS,
	profileImage: COVER_EXTENSIONS,
};

const IMAGE_FIELDS = ["cover", "profileImage"];

// A small multer "storage engine": streams every uploaded file straight into MongoDB (GridFS) with a
// random name, and keeps the first bytes so verifyFileContents can check what the file really is.
const kindOf = (fieldname) => (fieldname === "cover" ? "cover" : fieldname === "profileImage" ? "author" : "ebook");

const gridFsStorage = {
	_handleFile(req, file, cb) {
		let bucket;
		try {
			bucket = getBucket();
		} catch (error) {
			return cb(error);
		}

		// stores the file with its original extension and a random name
		const ext = path.extname(file.originalname).toLowerCase();
		const filename = file.fieldname + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
		const upload = bucket.openUploadStream(filename, {
			metadata: { kind: kindOf(file.fieldname), originalName: file.originalname },
		});

		let size = 0;
		let head = Buffer.alloc(0);
		file.stream.on("data", (chunk) => {
			size += chunk.length;
			if (head.length < 1024) head = Buffer.concat([head, chunk]).subarray(0, 1024);
		});
		file.stream.on("error", () => upload.abort().catch(() => {}));

		upload.on("error", cb);
		upload.on("finish", () => cb(null, { filename, id: upload.id, size, head }));
		file.stream.pipe(upload);
	},

	_removeFile(req, file, cb) {
		deleteById(file.id).then(
			() => cb(null),
			() => cb(null),
		);
	},
};

const fileFilter = function (req, file, cb) {
	const ext = path.extname(file.originalname).toLowerCase();
	const allowed = ALLOWED_EXTENSIONS[file.fieldname];
	if (allowed && allowed.includes(ext)) return cb(null, true);
	const error = new Error(allowed ? `"${file.fieldname}" must be one of: ${allowed.join(", ")}` : `Unexpected file field "${file.fieldname}"`);
	error.statusCode = 400;
	cb(error);
};

const uploadMiddleware = multer({
	storage: gridFsStorage,
	fileFilter,
	limits: { fileSize: config.maxEbookMb * 1024 * 1024 },
});

// Use on the book routes: accepts one "pdf", one "epub" and one "cover" image (all optional here;
// the book routes require at least one of pdf / epub when a book is created).
const uploadBookFiles = uploadMiddleware.fields([
	{ name: "pdf", maxCount: 1 },
	{ name: "epub", maxCount: 1 },
	{ name: "cover", maxCount: 1 },
]);

// Use on the author routes: accepts one "profileImage".
const uploadAuthorImage = uploadMiddleware.fields([{ name: "profileImage", maxCount: 1 }]);

/* ---------- Check what is really inside the uploaded files ---------- */

// The first bytes of a real file tell its true type, whatever the file name says.
const CONTENT_CHECKS = {
	pdf: (b) => b.includes("%PDF-"),
	// An EPUB is a ZIP file whose first entry is "mimetype: application/epub+zip".
	epub: (b) => b.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) && b.includes("application/epub+zip"),
	image: (b) => {
		const jpeg = b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
		const png = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
		const webp = b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
		return jpeg || png || webp;
	},
};

const TYPE_NAMES = { pdf: "a PDF", epub: "an EPUB", image: "a JPG, PNG or WEBP image" };

// Use right after uploadBookFiles / uploadAuthorImage. Rejects files whose content does not match
// their type, and images above MAX_COVER_MB. Rejected files are deleted again.
const verifyFileContents = function (req, res, next) {
	const files = Object.values(req.files || {}).flat();
	const maxImageBytes = config.maxCoverMb * 1024 * 1024;

	for (const file of files) {
		const kind = IMAGE_FIELDS.includes(file.fieldname) ? "image" : file.fieldname;
		let problem = null;

		if (kind === "image" && file.size > maxImageBytes) {
			problem = `"${file.fieldname}" is too large (max ${config.maxCoverMb} MB)`;
		} else if (!CONTENT_CHECKS[kind](file.head || Buffer.alloc(0))) {
			problem = `"${file.fieldname}" is not really ${TYPE_NAMES[kind]}`;
		}

		if (problem) {
			files.forEach((f) => deleteById(f.id));
			return next(new ApiError(400, problem));
		}
	}
	next();
};

module.exports = {
	uploadMiddleware,
	uploadBookFiles,
	uploadAuthorImage,
	verifyFileContents,
	coverPath,
	ebookPath,
	authorPath,
};
