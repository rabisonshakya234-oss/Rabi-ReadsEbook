const bookService = require("../Service/bookService");
const { getBucket } = require("../utils/gridfs");

const isAdmin = (req) => req.user && req.user.role === "admin";

async function createBook(req, res, next) {
  try {
    const book = await bookService.createBook(req.body, req.files);
    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    next(error);
  }
}

async function getBooks(req, res, next) {
  try {
    const result = await bookService.getBooks({
      ...req.query,
      includeInactive: isAdmin(req),
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getBookById(req, res, next) {
  try {
    const book = await bookService.getBookById(req.params.id, {
      includeInactive: isAdmin(req),
    });
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
}

async function getBookBySlug(req, res, next) {
  try {
    const book = await bookService.getBookBySlug(req.params.slug, {
      includeInactive: isAdmin(req),
    });
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
}

async function updateBook(req, res, next) {
  try {
    const book = await bookService.updateBook(req.params.id, req.body, req.files);
    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteBook(req, res, next) {
  try {
    await bookService.deleteBook(req.params.id);
    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/books/:id/download?format=pdf|epub  (anyone; logged-in downloads are saved to the user's history)
async function downloadBook(req, res, next) {
  try {
    const { filePath, fileId, length, downloadName, mimeType, book, format } = await bookService.getDownloadFile(req.params.id, req.query.format);

    await bookService.countDownload(book, req.user && req.user.id, format);

    // file saved in the database (GridFS): stream it to the browser
    if (fileId) {
      res.attachment(downloadName);
      res.type(mimeType || "application/octet-stream");
      res.set("Content-Length", length);
      const stream = getBucket().openDownloadStream(fileId);
      stream.on("error", (error) => (res.headersSent ? res.destroy(error) : next(error)));
      return stream.pipe(res);
    }

    // old file saved on disk
    res.type(mimeType || "application/octet-stream");
    res.download(filePath, downloadName, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBook,
  getBooks,
  getBookById,
  getBookBySlug,
  updateBook,
  deleteBook,
  downloadBook,
};