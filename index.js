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

// Rota para pegar o total de menções
app.get('/metrics', async (req, res) => {
  try {
    const { type, from, to } = req.query;

    // Definir intervalo padrão (últimos 30 dias) se não fornecido
    let queryFrom = from || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    let queryTo = to || new Date().toISOString().split('T')[0];

    if (type === 'total-mencoes') {
      const result = await pool.query(
        'SELECT COUNT(*) as total_mencoes FROM noticias WHERE created_at BETWEEN $1 AND $2',
        [queryFrom, queryTo]
      );
      res.json({ total_mencoes: parseInt(result.rows[0].total_mencoes) || 0 });
    } else if (type === 'mencoes-por-periodo') {
      const result = await pool.query(
        `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM noticias
          WHERE created_at BETWEEN $1 AND $2
          GROUP BY DATE(created_at)
          ORDER BY date;
        `,
        [queryFrom, queryTo]
      );
      const data = result.rows.map(row => ({
        name: row.date,
        value: parseInt(row.count)
      }));
      res.json(data);
    } else {
      res.status(400).send('Tipo de métrica inválido');
    }
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).send('Erro no servidor');
  }
});

// Nova rota para a pontuação total
app.get('/pontuacao-total', async (req, res) => {
  try {
    const { from, to } = req.query;

    // Definir intervalo padrão (últimos 30 dias) se não fornecido
    let queryFrom = from || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    let queryTo = to || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'SELECT COALESCE(SUM(pontos), 0) as total_pontuacao FROM noticias WHERE created_at BETWEEN $1 AND $2',
      [queryFrom, queryTo]
    );
    const totalPontuacao = parseFloat(result.rows[0].total_pontuacao) || 0;
    res.json({ total_pontuacao: totalPontuacao });
  } catch (error) {
    console.error('Erro ao buscar pontuação total:', error);
    res.status(500).send('Erro no servidor');
  }
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});