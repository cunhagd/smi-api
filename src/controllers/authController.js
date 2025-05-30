// src/controllers/authController.js
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { generateToken } = require('../utils/jwt');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar o usuário pelo email
    const user = await db.oneOrNone('SELECT * FROM "user" WHERE email = $1', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Email or password invalid' });
    }

    // Comparar a senha fornecida com o hash armazenado
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email or password invalid' });
    }

    // Gerar um token JWT
    const token = generateToken(user);

    // Retornar o token e informações do usuário
    res.status(200).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token not provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = require('../utils/jwt').verifyToken(token);

    res.status(200).json({ user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { login, verifyToken };