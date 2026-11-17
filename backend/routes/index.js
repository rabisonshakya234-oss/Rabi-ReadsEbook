var express = require('express');
var router = express.Router();

/* GET API status. */
router.get('/', function(req, res, next) {
  res.json({ success: true, message: 'Ebook API is running' });
});

module.exports = router;
