const path = require("path");
const mongoose = require("mongoose");

// Connects the upload middleware (middleware/FileHandleMiddleware.js) to the three places where
// files are kept in MongoDB (see utils/fileStore.js): covers, authors and ebooks.
const BUCKET_OF_KIND = { cover: "covers", author: "authors", ebook: "ebooks" };

const bucket = (name) => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: name });

// The middleware calls getBucket().openUploadStream(filename, { metadata: { kind } }).
// The right bucket is picked from metadata.kind ("cover", "author" or "ebook").
const getBucket = () => {
	if (!mongoose.connection.db) throw new Error("The database is not connected yet");
	return {
		openUploadStream: (filename, options = {}) =>
			bucket(BUCKET_OF_KIND[options.metadata && options.metadata.kind] || "ebooks").openUploadStream(filename, options),
		// used by the download route (bookController.downloadBook): ebook files live in the "ebooks" bucket
		openDownloadStream: (id) => bucket(BUCKET_OF_KIND.ebook).openDownloadStream(id),
	};
};

// Deletes an uploaded file by its id, whichever bucket it is in.
const deleteById = async (id) => {
	for (const name of Object.values(BUCKET_OF_KIND)) {
		try {
			await bucket(name).delete(id);
			return;
		} catch (error) {
			// not in this bucket: try the next one
		}
	}
};

// Finds a stored ebook file by its name (used by bookService.getDownloadFile).
// Gives the file document ({ _id, length, ... }) or null when it is not stored.
const findByName = async (name) => {
	if (!name || !mongoose.connection.db) return null;
	const [file] = await bucket(BUCKET_OF_KIND.ebook)
		.find({ filename: path.basename(String(name)) })
		.limit(1)
		.toArray();
	return file || null;
};

// Deletes the stored file(s) with this name, whichever bucket they are in (used by bookService and
// authorService when a file is replaced or a book / author is deleted). A missing file is not an error,
// and a problem here never becomes a server error.
const deleteByName = async (name) => {
	if (!name || !mongoose.connection.db) return;
	const clean = path.basename(String(name));
	for (const bucketName of Object.values(BUCKET_OF_KIND)) {
		try {
			const files = await bucket(bucketName).find({ filename: clean }).toArray();
			for (const file of files) await bucket(bucketName).delete(file._id).catch(() => {});
		} catch (error) {
			// ignore: nothing to delete in this bucket
		}
	}
};

// Express middleware for  app.use("/uploads/covers", serveImages("cover"), express.static(...)).
// It sends a stored cover ("cover") or author photo ("author") from MongoDB. When the file is not stored,
// it calls next(), so the static folder (old files) and then "not found" can answer. A problem with one
// image never becomes a server error: the reason is written to the log and the image counts as missing.
const serveImages = (kind) => (req, res, next) => {
	if (req.method !== "GET" && req.method !== "HEAD") return next();

	let name;
	try {
		name = decodeURIComponent(req.path.slice(1));
	} catch (error) {
		return next();
	}
	if (!name || name.includes("/") || name.includes("\\")) return next();

	require("./fileStore") // loaded here (not at the top) so that the two files never wait for each other
		.open(BUCKET_OF_KIND[kind], name)
		.then((file) => {
			if (!file) return next();
			res.type(path.extname(name));
			if (file.contentType) res.type(file.contentType);
			res.set({ "Content-Length": file.size, "Cache-Control": "public, max-age=31536000, immutable" });
			if (req.method === "HEAD") {
				file.stream.destroy();
				return res.end();
			}
			file.stream.on("error", (error) => {
				console.error("Stored image could not be read:", kind, name, "-", error.message);
				if (res.headersSent) return res.destroy(error);
				next();
			});
			file.stream.pipe(res);
		})
		.catch((error) => {
			console.error("Stored image lookup failed:", kind, name, "-", error.message);
			next();
		});
};

module.exports = { getBucket, deleteById, findByName, deleteByName, serveImages };
