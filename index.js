const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// Adicionar suporte a CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Conexão com o banco PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Rota para pegar as métricas
app.get('/metrics', async (req, res) => {
  try {
    // Obter parâmetros de data da query string
    const { from, to } = req.query;

    let query = 'SELECT COUNT(*) as total_mencoes FROM noticias';
    let queryParams = [];

    // Se from e to forem fornecidos, adicionar filtro de data
    if (from && to) {
      query += ' WHERE created_at BETWEEN $1 AND $2';
      queryParams = [from, to];
    }

    const result = await pool.query(query, queryParams);
    const totalMencoes = parseInt(result.rows[0].total_mencoes) || 0;
    res.json({ total_mencoes: totalMencoes });
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).send('Erro no servidor');
  }
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});