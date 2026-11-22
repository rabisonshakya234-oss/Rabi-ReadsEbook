const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Uploaded files are kept inside MongoDB (GridFS). The disk of a free Render server is wiped on every
// deploy, but the database is not, so the files stay. "kind" is one of: covers, authors, ebooks.
// multer first saves a file in uploads/<kind>/ (temporary); saveFromDisk then moves it into MongoDB.
const ROOT = path.join(__dirname, "..", "uploads");

const bucket = (kind) => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: kind });
const localPath = (kind, name) => path.join(ROOT, kind, path.basename(name));

async function findInDb(kind, name) {
	const [file] = await bucket(kind).find({ filename: path.basename(name) }).limit(1).toArray();
	return file;
}

// Copies the temporary file into MongoDB, then deletes the temporary copy.
// When the upload middleware already streamed the file into MongoDB, there is nothing to copy:
// only the content type is added.
async function saveFromDisk(kind, name, contentType) {
	if (await findInDb(kind, name)) {
		await mongoose.connection.db.collection(`${kind}.files`).updateOne({ filename: path.basename(name) }, { $set: { "metadata.contentType": contentType } });
		return;
	}
	const from = localPath(kind, name);
	await new Promise((resolve, reject) => {
		fs.createReadStream(from)
			.on("error", reject)
			.pipe(bucket(kind).openUploadStream(path.basename(name), { metadata: { contentType } }))
			.on("error", reject)
			.on("finish", resolve);
	});
	fs.unlink(from, () => {}); // the copy in MongoDB is the real one
}

// Saves text or bytes directly (used by the seed script).
async function saveBuffer(kind, name, buffer, contentType) {
	await new Promise((resolve, reject) => {
		const upload = bucket(kind).openUploadStream(path.basename(name), { metadata: { contentType } });
		upload.on("error", reject).on("finish", resolve);
		upload.end(buffer);
	});
}

// Gives { stream, size, contentType } for a stored file, or null when it does not exist.
// A file that is still only on the disk (made before this change) is found too.
async function open(kind, name) {
	if (!name) return null;
	name = path.basename(name);

	const file = await findInDb(kind, name);
	if (file) {
		return {
			stream: bucket(kind).openDownloadStreamByName(name),
			size: file.length,
			contentType: file.metadata && file.metadata.contentType,
		};
	}

	const onDisk = localPath(kind, name);
	if (fs.existsSync(onDisk)) {
		return { stream: fs.createReadStream(onDisk), size: fs.statSync(onDisk).size, contentType: undefined };
	}
	return null;
}

async function exists(kind, name) {
	if (!name) return false;
	return Boolean((await findInDb(kind, name)) || fs.existsSync(localPath(kind, name)));
}

// Deletes the file from MongoDB and from the disk. A missing file is not an error.
async function removeFile(kind, name) {
	if (!name) return;
	name = path.basename(name);

	const files = await bucket(kind).find({ filename: name }).toArray();
	for (const file of files) await bucket(kind).delete(file._id).catch(() => {});
	fs.unlink(localPath(kind, name), () => {});
}

// Deletes every stored file of one kind (used by "npm run seed -- --fresh").
async function dropAll(kind) {
	await bucket(kind).drop().catch(() => {}); // fails when nothing was ever stored: fine
}

module.exports = { saveFromDisk, saveBuffer, open, exists, removeFile, dropAll };