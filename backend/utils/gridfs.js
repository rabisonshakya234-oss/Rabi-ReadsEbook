const path = require("path");
const mongoose = require("mongoose");

let bucket = null;

// Returns the GridFS bucket. The MongoDB connection must already be open.
function getBucket() {
	const db = mongoose.connection && mongoose.connection.db;
	if (!db) {
		throw new Error("Database is not connected yet");
	}
	if (!bucket) {
		bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });
	}
	return bucket;
}

// Deletes one file from GridFS by its id. Never throws if the file is already gone.
async function deleteById(id) {
	if (!id) return;
	try {
		await getBucket().delete(new mongoose.Types.ObjectId(String(id)));
	} catch (error) {
		// file not found or already deleted: nothing to do
	}
}

// Public images (covers / author photos) are read from GridFS by file name.
// If the file is not in GridFS (old files on disk), call next() so express.static can try.
const IMAGE_TYPES = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
};

function serveImages(kind) {
	return async function (req, res, next) {
		if (req.method !== "GET" && req.method !== "HEAD") return next();
		try {
			const filename = decodeURIComponent(path.basename(req.path));
			if (!filename || filename === "/") return next();

			const bucket = getBucket();
			const files = await bucket.find({ filename, "metadata.kind": kind }).limit(1).toArray();
			if (!files.length) return next();

			const ext = path.extname(filename).toLowerCase();
			res.set("Content-Type", IMAGE_TYPES[ext] || "application/octet-stream");
			res.set("Cache-Control", "public, max-age=86400");
			if (req.method === "HEAD") return res.end();

			bucket
				.openDownloadStream(files[0]._id)
				.on("error", next)
				.pipe(res);
		} catch (error) {
			next(error);
		}
	};
}

module.exports = {
	getBucket,
	deleteById,
	serveImages,
};
