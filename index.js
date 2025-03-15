const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.get('/metrics', async (req, res) => {
  try {
    const { type, from, to } = req.query;

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
    console.error('Erro ao buscar métricas:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

app.get('/pontuacao-total', async (req, res) => {
  try {
    const { from, to } = req.query;

    let queryFrom = from || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    let queryTo = to || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'SELECT COALESCE(SUM(pontos), 0) as total_pontuacao FROM noticias WHERE created_at BETWEEN $1 AND $2',
      [queryFrom, queryTo]
    );
    const totalPontuacao = parseFloat(result.rows[0].total_pontuacao) || 0;
    res.json({ total_pontuacao: totalPontuacao });
  } catch (error) {
    console.error('Erro ao buscar pontuação total:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

app.get('/portais-relevantes', async (req, res) => {
  try {
    const { from, to, type } = req.query;

    let queryFrom = from || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    let queryTo = to || new Date().toISOString().split('T')[0];

    let query = `
      SELECT portal, COALESCE(SUM(pontos), 0) as total_pontuacao
      FROM noticias
      WHERE created_at BETWEEN $1 AND $2
    `;
    let whereClause = '';
    let orderByClause = 'ORDER BY total_pontuacao DESC';

    if (type === 'positivas') {
      whereClause = ' AND pontos > 0';
    } else if (type === 'negativas') {
      orderByClause = 'ORDER BY total_pontuacao ASC';
    }

    query += whereClause + ' GROUP BY portal ' + orderByClause;

    const result = await pool.query(query, [queryFrom, queryTo]);

    const data = result.rows.map(row => ({
      name: row.portal || 'Desconhecido',
      value: parseFloat(row.total_pontuacao)
    }));

    let top5, bottom5;
    if (type === 'positivas') {
      top5 = data.slice(0, 5);
      bottom5 = [];
    } else if (type === 'negativas') {
      bottom5 = data.slice(0, 5);
      top5 = [];
    } else {
      top5 = data.slice(0, 5);
      bottom5 = data.slice(-5).reverse();
    }

    res.json({ top5, bottom5 });
  } catch (error) {
    console.error('Erro ao buscar portais relevantes:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

app.get('/portais', async (req, res) => {
  try {
    const queryFrom = '2025-03-01';
    const queryTo = '2025-03-15';

    console.log('Intervalo de busca na API:', { queryFrom, queryTo });

    const result = await pool.query(
      `
        SELECT DISTINCT portal
        FROM noticias
        WHERE created_at BETWEEN $1::timestamp AND $2::timestamp
        ORDER BY portal ASC
      `,
      [queryFrom + ' 00:00:00', queryTo + ' 23:59:59']
    );

    console.log('Registros de portais encontrados na API:', result.rows.length);
    console.log('Primeiros registros (se houver):', result.rows.slice(0, 5));

    const data = result.rows.map(row => ({
      portal: row.portal || 'Desconhecido'
    }));

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar portais:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

app.get('/noticias', async (req, res) => {
  try {
    const queryFrom = '2025-03-01';
    const queryTo = '2025-03-15';

    console.log('Intervalo de busca na API:', { queryFrom, queryTo });

    const result = await pool.query(
      `
        SELECT created_at AS data, portal
        FROM noticias
        WHERE created_at BETWEEN $1::timestamp AND $2::timestamp
        ORDER BY created_at DESC
      `,
      [queryFrom + ' 00:00:00', queryTo + ' 23:59:59']
    );

    console.log('Registros de notícias encontrados na API:', result.rows.length);
    console.log('Primeiros registros (se houver):', result.rows.slice(0, 5));

    const data = result.rows.map(row => ({
      data: row.data || '',
      portal: row.portal || 'Desconhecido'
    }));

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});