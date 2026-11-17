const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const User = require('../models/userModel');
const Download = require('../models/downloadModel');
const { cleanUser } = require('./authService'); // Import the cleanUser function from authService

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return cleanUser(user);
};

const updateProfile = async (userId, { username }) => {
  username = username.trim();

  const taken = await User.findOne({ username });
  if (taken && taken._id.toString() !== userId) throw new ApiError(409, 'Username is already in use');

  const user = await User.findByIdAndUpdate(userId, { username }, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return cleanUser(user);
};

// Admin only. Query values arrive as text, so they are turned into numbers here.
const listUsers = async ({ page = 1, limit = 20 } = {}) => {
  page = Math.max(Number(page) || 1, 1);
  limit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const users = await User.find({}).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit);
  const total = await User.countDocuments({});
  return { users: users.map(cleanUser), pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const checkId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, 'Invalid user id');
};

// Admin: one user.
const getUserById = async (id) => {
  checkId(id);
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return cleanUser(user);
};

// Admin: make a user an admin, or a normal user again. You cannot change your own role.
const updateUserRole = async (id, role, adminId) => {
  checkId(id);
  if (id === adminId) throw new ApiError(400, 'You cannot change your own role');

  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return cleanUser(user);
};

// Admin: delete a user. You cannot delete yourself. Their downloads stay in the statistics.
const deleteUser = async (id, adminId) => {
  checkId(id);
  if (id === adminId) throw new ApiError(400, 'You cannot delete your own account here');

  const user = await User.findByIdAndDelete(id);
  if (!user) throw new ApiError(404, 'User not found');
  await Download.updateMany({ user: id }, { $unset: { user: 1 } });
};

module.exports = { getProfile, updateProfile, listUsers, getUserById, updateUserRole, deleteUser };
