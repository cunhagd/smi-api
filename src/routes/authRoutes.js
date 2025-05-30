// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, verifyToken } = require('../controllers/authController');
const { validateLogin } = require('../middleware/validateRequest');
const loginRateLimit = require('../middleware/rateLimit');

router.post('/login', loginRateLimit, validateLogin, login);
router.get('/verify', verifyToken);

module.exports = router;