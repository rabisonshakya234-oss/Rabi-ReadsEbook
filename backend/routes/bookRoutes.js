const express = require("express");
const bookController = require("../controllers/bookController");
const validate = require("../validator/validators");
const {
  protect,
  restrictTo,
  optionalProtect,
} = require("../middleware/AuthMiddleware");
const { uploadBookFiles, verifyFileContents } = require("../middleware/FileHandleMiddleware");
const { downloadLimiter } = require("../utils/rateLimiter");

const router = express.Router();

// The forms may send the book title as "title" instead of "name".
const titleAlias = (req, res, next) => {
  if (req.body && req.body.name === undefined && req.body.title !== undefined) req.body.name = req.body.title;
  next();
};

// Public (a logged-in admin also sees inactive books)
router.get("/", optionalProtect, validate.listBooks, bookController.getBooks);
router.get("/slug/:slug", optionalProtect, bookController.getBookBySlug); // keep before "/:id"

// Anyone can download (free). Logged-in downloads are also saved in the user's history.
// ?format=pdf or ?format=epub
router.get("/:id/download", optionalProtect, downloadLimiter, validate.bookId, bookController.downloadBook);

router.get("/:id", optionalProtect, validate.bookId, bookController.getBookById);

// Admin only. Send multipart/form-data with files "pdf", "epub" (at least one when creating) and "cover".
router.post("/", protect, restrictTo("admin"), uploadBookFiles, verifyFileContents, titleAlias, validate.createBook, bookController.createBook);
router.patch("/:id", protect, restrictTo("admin"), validate.bookId, uploadBookFiles, verifyFileContents, titleAlias, validate.updateBook, bookController.updateBook);
router.delete("/:id", protect, restrictTo("admin"), validate.bookId, bookController.deleteBook);

module.exports = router;
