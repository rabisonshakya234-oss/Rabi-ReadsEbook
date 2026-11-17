const asyncHandler = require('../utils/asyncHandler');
const userService = require('../Service/userService');

async function getProfile(req, res) {
  const user = await userService.getProfile(req.user.id);
  res.json({ success: true, message: 'Profile fetched', data: { user } });
}

async function updateProfile(req, res) {
  const user = await userService.updateProfile(req.user.id, req.body);
  res.json({ success: true, message: 'Profile updated', data: { user } });
}

async function listUsers(req, res) {
  const data = await userService.listUsers(req.query);
  res.json({ success: true, message: 'Users fetched', data });
}

async function getUserById(req, res) {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, message: 'User fetched', data: { user } });
}

async function updateUser(req, res) {
  const user = await userService.updateUserRole(req.params.id, req.body.role, req.user.id);
  res.json({ success: true, message: 'User updated', data: { user } });
}

async function deleteUser(req, res) {
  await userService.deleteUser(req.params.id, req.user.id);
  res.json({ success: true, message: 'User deleted' });
}

module.exports = {
  getProfile: asyncHandler(getProfile),
  updateProfile: asyncHandler(updateProfile),
  listUsers: asyncHandler(listUsers),
  getUserById: asyncHandler(getUserById),
  updateUser: asyncHandler(updateUser),
  deleteUser: asyncHandler(deleteUser),
};