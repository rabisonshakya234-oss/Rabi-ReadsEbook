const express = require("express");
const categoryController = require("../controllers/categoryController");
const validate = require("../validator/validators");
const { protect, restrictTo } = require("../middleware/AuthMiddleware");

const router = express.Router();

// Public
router.get("/", categoryController.getCategories);
router.get("/slug/:slug", categoryController.getCategoryBySlug); // keep before "/:id"
router.get("/:id", validate.categoryId, categoryController.getCategoryById);

// Admin only
router.post("/", protect, restrictTo("admin"), validate.createCategory, categoryController.createCategory);
router.patch("/:id", protect, restrictTo("admin"), validate.categoryId, validate.updateCategory, categoryController.updateCategory);
router.delete("/:id", protect, restrictTo("admin"), validate.categoryId, categoryController.deleteCategory);

module.exports = router;
