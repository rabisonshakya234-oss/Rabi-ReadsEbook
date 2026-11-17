// Loads the .env file and exposes all settings in one place.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const env = process.env;
const clientUrl = (env.CLIENT_URL || 'http://localhost:5000').replace(/\/+$/, '');

const config = {
  isProduction: env.NODE_ENV === 'production',
  mongoUri: env.MONGODB_URI,
  jwtSecret: env.Auth_SecretKey,
  jwtExpiresIn: env.JWT_EXPIRES_IN || '1d',
  saltRounds: Number(env.BCRYPT_SALT_ROUNDS) || 10,
  clientUrl,
  // The reset email links to <resetPageUrl>/<token>.
  resetPageUrl: (env.RESET_PAGE_URL || `${clientUrl}/#/reset`).replace(/\/+$/, ''),
  resetTokenMinutes: Number(env.RESET_TOKEN_EXPIRES_MINUTES) || 15,
  maxEbookMb: Number(env.MAX_EBOOK_MB) || 100,
  maxCoverMb: Number(env.MAX_COVER_MB) || 5, // cover and author images
  adminEmail: env.ADMIN_EMAIL, // contact-form messages are also emailed here (optional)

  // nodemailer (SMTP) settings
  mail: {
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT) || 587,
    secure: env.EMAIL_SECURE === 'true',
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
    from: env.EMAIL_FROM || env.EMAIL_USER || 'Ebook Store <no-reply@localhost>',
  },
};

if (!config.mongoUri || !config.jwtSecret) {
  throw new Error('MONGODB_URI and Auth_SecretKey must be set in the .env file');
}

module.exports = config;
