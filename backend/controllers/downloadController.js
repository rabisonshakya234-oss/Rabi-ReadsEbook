const downloadService = require("../Service/downloadService");

async function getMyDownloads(req, res, next) {
  try {
    const result = await downloadService.getMyDownloads(req.user.id, req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getMyLibrary(req, res, next) {
  try {
    const result = await downloadService.getMyLibrary(req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getAllDownloads(req, res, next) {
  try {
    const result = await downloadService.getAllDownloads(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMyDownloads, getMyLibrary, getAllDownloads };
