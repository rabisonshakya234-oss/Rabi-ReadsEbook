const dashboardService = require("../Service/dashboardService");

async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.getDashboard();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getDownloadStats(req, res, next) {
  try {
    const data = await dashboardService.getDownloadStats(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard, getDownloadStats };
