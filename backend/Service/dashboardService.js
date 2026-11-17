const Book = require("../models/bookModel");
const Category = require("../models/categoryModel");
const Author = require("../models/authorModel");
const User = require("../models/userModel");
const Download = require("../models/downloadModel");
const ContactMessage = require("../models/contactModel");

// Turns [{ _id: "pdf", count: 4 }] into { pdf: 4, epub: 0 }.
const formatCounts = (rows) => {
	const result = { pdf: 0, epub: 0 };
	for (const row of rows) result[row._id] = row.count;
	return result;
};

// Downloads per day for the last N days, with 0 for days that had none (handy for charts).
async function downloadsPerDay(days) {
	const since = new Date();
	since.setUTCHours(0, 0, 0, 0);
	since.setUTCDate(since.getUTCDate() - (days - 1));

	const rows = await Download.aggregate([
		{ $match: { createdAt: { $gte: since } } },
		{ $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
	]);
	const countByDay = new Map(rows.map((r) => [r._id, r.count]));

	const result = [];
	for (let i = 0; i < days; i++) {
		const day = new Date(since);
		day.setUTCDate(since.getUTCDate() + i);
		const key = day.toISOString().slice(0, 10);
		result.push({ date: key, count: countByDay.get(key) || 0 });
	}
	return result;
}

const topBooks = (limit) =>
	Book.find({ downloadCount: { $gt: 0 } })
		.sort("-downloadCount")
		.limit(limit)
		.select("name slug author downloadCount");

// Admin: numbers for the dashboard home page.
async function getDashboard() {
	const [
		totalBooks,
		activeBooks,
		featuredBooks,
		totalCategories,
		totalAuthors,
		totalUsers,
		totalAdmins,
		totalDownloads,
		byFormat,
		unreadMessages,
		top,
		recentDownloads,
		recentBooks,
		last7Days,
	] = await Promise.all([
		Book.countDocuments({}),
		Book.countDocuments({ isActive: true }),
		Book.countDocuments({ isFeatured: true }),
		Category.countDocuments({}),
		Author.countDocuments({}),
		User.countDocuments({}),
		User.countDocuments({ role: "admin" }),
		Download.countDocuments({}),
		Download.aggregate([{ $group: { _id: "$format", count: { $sum: 1 } } }]),
		ContactMessage.countDocuments({ isRead: false }),
		topBooks(5),
		Download.find({}).populate("user", "username").populate("book", "name slug").sort("-createdAt").limit(5),
		Book.find({}).sort("-createdAt").limit(5).select("name slug author createdAt isActive"),
		downloadsPerDay(7),
	]);

	return {
		books: { total: totalBooks, active: activeBooks, inactive: totalBooks - activeBooks, featured: featuredBooks },
		categories: totalCategories,
		authors: totalAuthors,
		users: { total: totalUsers, admins: totalAdmins },
		downloads: { total: totalDownloads, byFormat: formatCounts(byFormat), last7Days },
		unreadMessages,
		topBooks: top,
		recentDownloads,
		recentBooks,
	};
}

// Admin: download statistics. ?days=30 (1-365) for the daily chart, ?top=10 (1-50) for the top books.
async function getDownloadStats({ days = 30, top = 10 } = {}) {
	days = Math.min(Math.max(Number(days) || 30, 1), 365);
	top = Math.min(Math.max(Number(top) || 10, 1), 50);

	const [total, byFormat, guests, perDay, topList] = await Promise.all([
		Download.countDocuments({}),
		Download.aggregate([{ $group: { _id: "$format", count: { $sum: 1 } } }]),
		Download.countDocuments({ user: { $exists: false } }),
		downloadsPerDay(days),
		topBooks(top),
	]);

	return {
		total,
		byFormat: formatCounts(byFormat),
		byUserType: { loggedIn: total - guests, guests },
		days,
		perDay,
		topBooks: topList,
	};
}

module.exports = { getDashboard, getDownloadStats };
