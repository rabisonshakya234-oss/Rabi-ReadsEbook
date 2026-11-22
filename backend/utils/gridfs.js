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

module.exports = { getBucket, deleteById, serveImages };
