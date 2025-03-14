const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// Conexão com o banco PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL // Usará a variável do Railway
});

// Rota para pegar as métricas
app.get('/metrics', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM noticias'); // Substitua "sua_tabela" pelo nome real
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).send('Erro no servidor');
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});