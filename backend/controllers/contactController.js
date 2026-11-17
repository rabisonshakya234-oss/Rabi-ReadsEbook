const contactService = require("../Service/contactService");

// POST /api/contact  (public)
async function createMessage(req, res, next) {
  try {
    await contactService.createMessage(req.body);
    res.status(201).json({
      success: true,
      message: "Thank you! Your message has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

async function getMessages(req, res, next) {
  try {
    const result = await contactService.getMessages(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getMessageById(req, res, next) {
  try {
    const message = await contactService.getMessageById(req.params.id);
    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
}

async function setRead(req, res, next) {
  try {
    const message = await contactService.setRead(req.params.id, req.body.isRead);
    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: message,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteMessage(req, res, next) {
  try {
    await contactService.deleteMessage(req.params.id);
    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMessage,
  getMessages,
  getMessageById,
  setRead,
  deleteMessage,
};
