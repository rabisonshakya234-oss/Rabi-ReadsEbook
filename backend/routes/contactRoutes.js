const express = require("express");
const contactController = require("../controllers/contactController");
const validate = require("../validator/validators");
const { protect, restrictTo } = require("../middleware/AuthMiddleware");
const { contactLimiter } = require("../utils/rateLimiter");

const router = express.Router();

// Public: the Contact Us form
router.post("/", contactLimiter, validate.createContact, contactController.createMessage);

// Admin only: read and manage the messages
router.get("/", protect, restrictTo("admin"), validate.listContacts, contactController.getMessages);
router.get("/:id", protect, restrictTo("admin"), validate.contactId, contactController.getMessageById);
router.patch("/:id", protect, restrictTo("admin"), validate.contactId, validate.updateContact, contactController.setRead);
router.delete("/:id", protect, restrictTo("admin"), validate.contactId, contactController.deleteMessage);

module.exports = router;
