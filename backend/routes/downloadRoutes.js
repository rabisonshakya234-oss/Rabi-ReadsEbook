const express = require("express");
const downloadController = require("../controllers/downloadController");
const validate = require("../validator/validators");
const { protect, restrictTo } = require("../middleware/AuthMiddleware");

const router = express.Router();

// Every download route needs a logged-in user.
router.use(protect);

// Any logged-in user
router.get("/my", validate.listDownloads, downloadController.getMyDownloads); // download history
router.get("/library", downloadController.getMyLibrary); // books I have downloaded

// Admin only
router.get("/", restrictTo("admin"), validate.listDownloads, downloadController.getAllDownloads);

module.exports = router;
