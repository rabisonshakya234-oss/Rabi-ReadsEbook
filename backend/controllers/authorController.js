const authorService = require("../Service/authorService");

async function createAuthor(req, res, next) {
  try {
    const author = await authorService.createAuthor(req.body, req.files);
    res.status(201).json({
      success: true,
      message: "Author created successfully",
      data: author,
    });
  } catch (error) {
    next(error);
  }
}

async function getAuthors(req, res, next) {
  try {
    const result = await authorService.getAuthors(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getAuthorById(req, res, next) {
  try {
    const author = await authorService.getAuthorById(req.params.id);
    res.status(200).json({ success: true, data: author });
  } catch (error) {
    next(error);
  }
}

async function getAuthorBySlug(req, res, next) {
  try {
    const author = await authorService.getAuthorBySlug(req.params.slug);
    res.status(200).json({ success: true, data: author });
  } catch (error) {
    next(error);
  }
}

async function updateAuthor(req, res, next) {
  try {
    const author = await authorService.updateAuthor(req.params.id, req.body, req.files);
    res.status(200).json({
      success: true,
      message: "Author updated successfully",
      data: author,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAuthor(req, res, next) {
  try {
    await authorService.deleteAuthor(req.params.id);
    res.status(200).json({
      success: true,
      message: "Author deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAuthor,
  getAuthors,
  getAuthorById,
  getAuthorBySlug,
  updateAuthor,
  deleteAuthor,
};
