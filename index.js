const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// Conexão com o banco PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Rota para pegar as métricas
app.get('/metrics', async (req, res) => {
  try {
    // Calcular o total de menções (número de notícias)
    const result = await pool.query('SELECT COUNT(*) as total_mencoes FROM noticias');
    const totalMencoes = parseInt(result.rows[0].total_mencoes) || 0; // Converte para número, 0 se não houver dados
    res.json({ total_mencoes: totalMencoes });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).send('Erro no servidor');
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});