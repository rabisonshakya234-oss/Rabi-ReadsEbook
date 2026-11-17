const mongoose = require("mongoose");

// A message sent from the "Contact Us" page.
const contactSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		subject: {
			type: String,
			trim: true,
			default: "",
		},
		message: {
			type: String,
			required: true,
			trim: true,
		},
		isRead: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
);

contactSchema.index({ isRead: 1, createdAt: -1 });

const ContactMessage = mongoose.model("ContactMessage", contactSchema);
module.exports = ContactMessage;
