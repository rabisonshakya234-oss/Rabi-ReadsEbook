require('./config/env'); // load .env before anything reads process.env
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var helmet = require('helmet');

var authRoutes = require('./routes/authRoutes');
var userRoutes = require('./routes/userRoutes');
var bookRoutes = require('./routes/bookRoutes');
var categoryRoutes = require('./routes/categoryRoutes');
var downloadRoutes = require('./routes/downloadRoutes');
var authorRoutes = require('./routes/authorRoutes');
var contactRoutes = require('./routes/contactRoutes');
var adminRoutes = require('./routes/adminRoutes');
var { notFound, errorHandler } = require('./utils/errorHandler');
var { serveImages } = require('./utils/gridfs');
var app = express();

// Middleware (must come before the routes)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(logger('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Cover images and author photos are public. Ebook files are NOT served here: they are only
// available through the protected download route.
app.use('/uploads/covers', serveImages('cover'), express.static(path.join(__dirname, 'uploads', 'covers')));
app.use('/uploads/authors', serveImages('author'), express.static(path.join(__dirname, 'uploads', 'authors')));
// Health check
app.get('/api', function (req, res) {
  res.status(200).json({ success: true, message: 'Ebook API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes); // books
app.use('/api/categories', categoryRoutes); // genres
app.use('/api/downloads', downloadRoutes); // download history + library
app.use('/api/authors', authorRoutes); // book authors
app.use('/api/contact', contactRoutes); // Contact Us form + admin inbox
app.use('/api/admin', adminRoutes); // dashboard + download statistics

// Unknown route
app.use(notFound);

// Error handler (must be last). Every next(error) ends up here.
app.use(errorHandler);

/**
 * Module dependencies.
 */

require('./config/db')(); 
var debug = require('debug')('backend:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

module.exports = app;
