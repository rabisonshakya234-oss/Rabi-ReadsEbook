const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema(
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
		biography: {
			type: String,
			trim: true,
			default: "",
		},
		profileImage: {
			url: String,
			publicId: String, // file name on disk
		},
	},
	{ timestamps: true },
);

authorSchema.index({ name: "text" });

const Author = mongoose.model("Author", authorSchema);
module.exports = Author;
