const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const validate = require("../validator/validators");
const { protect, restrictTo } = require("../middleware/AuthMiddleware");

const router = express.Router();

router.use(protect, restrictTo("admin")); // everything below is admin only

router.get("/dashboard", dashboardController.getDashboard); // website statistics
router.get("/download-stats", validate.downloadStats, dashboardController.getDownloadStats); // download statistics

module.exports = router;
