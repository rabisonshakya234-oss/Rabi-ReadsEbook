const express = require("express");
const authorController = require("../controllers/authorController");
const validate = require("../validator/validators");
const { protect, restrictTo } = require("../middleware/AuthMiddleware");
const { uploadAuthorImage, verifyFileContents } = require("../middleware/FileHandleMiddleware");

const router = express.Router();

// Public
router.get("/", validate.listAuthors, authorController.getAuthors);
router.get("/slug/:slug", authorController.getAuthorBySlug); // keep before "/:id"
router.get("/:id", validate.authorId, authorController.getAuthorById);

// Admin only. Send multipart/form-data with an optional "profileImage" file.
router.post("/", protect, restrictTo("admin"), uploadAuthorImage, verifyFileContents, validate.createAuthor, authorController.createAuthor);
router.patch("/:id", protect, restrictTo("admin"), validate.authorId, uploadAuthorImage, verifyFileContents, validate.updateAuthor, authorController.updateAuthor);
router.delete("/:id", protect, restrictTo("admin"), validate.authorId, authorController.deleteAuthor);

module.exports = router;
