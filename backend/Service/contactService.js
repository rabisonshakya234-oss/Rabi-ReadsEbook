const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const config = require("../config/env");
const sendEmail = require("../utils/sendEmail");
const ContactMessage = require("../models/contactModel");

const checkId = (id) => {
	if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid message id");
};

// Public: a visitor sends a message. It is saved, and also emailed to ADMIN_EMAIL when that is set.
async function createMessage({ name, email, subject, message } = {}) {
	const saved = await ContactMessage.create({
		name: String(name).trim(),
		email: String(email).trim(),
		subject: subject ? String(subject).trim() : "",
		message: String(message).trim(),
	});

	if (config.adminEmail) {
		try {
			await sendEmail({
				to: config.adminEmail,
				subject: `[RabiReads contact] ${saved.subject || "New message"}`,
				text: `From: ${saved.name} <${saved.email}>\n\n${saved.message}`,
			});
		} catch (error) {
			console.error("Contact email could not be sent:", error.message); // the message is saved anyway
		}
	}

	return saved;
}

// Admin: newest first. Optional filter ?isRead=true|false.
async function getMessages({ isRead, page = 1, limit = 20 } = {}) {
	const filter = {};
	if (isRead !== undefined) filter.isRead = String(isRead) === "true";

	page = Math.max(Number(page) || 1, 1);
	limit = Math.min(Math.max(Number(limit) || 20, 1), 100);

	const [messages, total, unread] = await Promise.all([
		ContactMessage.find(filter)
			.sort("-createdAt")
			.skip((page - 1) * limit)
			.limit(limit),
		ContactMessage.countDocuments(filter),
		ContactMessage.countDocuments({ isRead: false }),
	]);

	return { messages, total, unread, page, pages: Math.ceil(total / limit) };
}

async function getMessageById(id) {
	checkId(id);

	const message = await ContactMessage.findById(id);
	if (!message) throw new ApiError(404, "Message not found");

	return message;
}

async function setRead(id, isRead) {
	checkId(id);

	const message = await ContactMessage.findByIdAndUpdate(id, { $set: { isRead: String(isRead) === "true" } }, { new: true });
	if (!message) throw new ApiError(404, "Message not found");

	return message;
}

async function deleteMessage(id) {
	checkId(id);

	const message = await ContactMessage.findByIdAndDelete(id);
	if (!message) throw new ApiError(404, "Message not found");
}

module.exports = { createMessage, getMessages, getMessageById, setRead, deleteMessage };
