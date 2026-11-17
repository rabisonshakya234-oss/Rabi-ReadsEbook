const express = require('express');
const controller = require('../controllers/userController');
const validate = require('../validator/validators');
const { protect } = require('../middleware/AuthMiddleware');
const { authorize } = require('../middleware/RoleMiddleware');


const router = express.Router();

router.use(protect); // every route below needs a logged-in user

router.get('/me', controller.getProfile);
router.patch('/me', validate.updateProfile, controller.updateProfile);
router.get('/', authorize('admin'), validate.listUsers, controller.listUsers); // page & limit check

// Admin: manage users (keep after '/me')
router.get('/:id', authorize('admin'), validate.userId, controller.getUserById);
router.patch('/:id', authorize('admin'), validate.userId, validate.updateUser, controller.updateUser); // body: { role }
router.delete('/:id', authorize('admin'), validate.userId, controller.deleteUser);

module.exports = router;