const mongoose = require("mongoose");

// One row each time a book is downloaded. "user" is empty when a guest (not logged in) downloads.
const downloadSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		book: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Book",
			required: true,
		},
		format: {
			type: String,
			enum: ["pdf", "epub"],
			required: true,
		},
		downloadedAt: {
			type: Date,
			default: Date.now,
		},
		nameAtDownload: String,
		authorAtDownload: String,
	},
	{ timestamps: true },
);

downloadSchema.index({ user: 1, createdAt: -1 });
downloadSchema.index({ book: 1 });
downloadSchema.index({ createdAt: -1 });

const Download = mongoose.model("Download", downloadSchema);
module.exports = Download;
