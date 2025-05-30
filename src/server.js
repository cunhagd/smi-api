// auth-service/src/server.js
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Lista de origens permitidas
// Adicionamos a URL do seu frontend em produção ('https://smi.up.railway.app')
// Mantemos a leitura da variável de ambiente FRONTEND_URL para flexibilidade
// E também a URL de desenvolvimento local.
const allowedOrigins = [
  'https://smi.up.railway.app', // Sua URL de frontend em produção
  process.env.FRONTEND_URL, 
  'http://localhost:8080',   // URL configurada via variável de ambiente (se existir)
  'http://127.0.0.1:8080'     // Outra comum para desenvolvimento local
].filter(Boolean); // Isso remove quaisquer valores undefined/null se FRONTEND_URL não estiver definida

// Configurar CORS
app.use(cors({
  origin: function (origin, callback) {
    // O 'origin' é o domínio que está fazendo a requisição.
    // Se a requisição não tiver 'origin' (ex: Postman, apps mobile) ou se a 'origin' estiver na nossa lista, permitimos.
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Se a origem não estiver permitida, registramos um erro e rejeitamos a requisição.
      console.error(`ERRO DE CORS: A origem '${origin}' não é permitida.`);
      console.error(`Origens permitidas: ${allowedOrigins.join(', ')}`);
      callback(new Error(`A origem '${origin}' não é permitida pela política de CORS.`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'], // Cabeçalhos permitidos
  credentials: true, // Permite o envio de cookies e cabeçalhos de autorização
  optionsSuccessStatus: 200 // Alguns navegadores legados (IE11, vários SmartTVs) engasgam com 204
}));

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Rotas de autenticação
app.use('/auth', authRoutes);

// Middleware para tratar erros de rota não encontrada (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware para tratar outros erros
app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err.stack);
  res.status(500).json({ message: 'Erro interno do servidor', error: err.message });
});


// Iniciar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serviço de autenticação rodando na porta ${PORT}`);
  console.log(`Origens CORS permitidas: ${allowedOrigins.join(', ')}`);
  if (!process.env.FRONTEND_URL) {
    console.warn("Atenção: A variável de ambiente FRONTEND_URL não está definida. Usando fallbacks para CORS.");
  }
  if (!process.env.JWT_SECRET) {
    console.error("ERRO CRÍTICO: A variável de ambiente JWT_SECRET não está definida! O serviço não funcionará corretamente.");
    // Em um cenário real, você poderia querer impedir o servidor de iniciar sem JWT_SECRET.
    // process.exit(1);
  }
});
