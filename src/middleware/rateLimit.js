// src/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const loginRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // Máximo de 5 tentativas por IP
  message: 'Too many login attempts, please try again after 5 minutes',
});

module.exports = loginRateLimit;