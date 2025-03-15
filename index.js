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

// Rota para a pontuação total
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

// Rota para portais relevantes
app.get('/portais-relevantes', async (req, res) => {
  try {
    const { from, to, type } = req.query;

    // Definir intervalo padrão (últimos 30 dias) se não fornecido
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
    console.error('Erro ao buscar portais relevantes:', error);
    res.status(500).send('Erro no servidor');
  }
});

// Rota para buscar notícias
app.get('/noticias', async (req, res) => {
  try {
    const { from, to } = req.query;

    // Definir intervalo padrão (últimos 30 dias) se não fornecido
    let queryFrom = from || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
    let queryTo = to || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `
        SELECT id, created_at AS data, portal, titulo, link, pontos, sentimento, abrangencia
        FROM noticias
        WHERE created_at BETWEEN $1 AND $2
        ORDER BY created_at DESC
      `,
      [queryFrom, queryTo]
    );

    const data = result.rows.map(row => ({
      id: row.id.toString(),
      data: row.data,
      portal: row.portal,
      titulo: row.titulo,
      link: row.link,
      pontos: row.pontos,
      sentimento: row.sentimento,
      abrangencia: row.abrangencia ? row.abrangencia.toString() : '0'
    }));

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    res.status(500).send('Erro no servidor');
  }
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});