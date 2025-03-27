const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

// Teste de conexão ao iniciar o servidor
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar ao PostgreSQL:', err.stack);
  }
  console.log('Conectado ao PostgreSQL com sucesso!');
  release();
});

app.use(express.json()); 
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Rotas existentes
app.get('/metrics', async (req, res) => {
  const { type, from, to } = req.query;
  let client;
  try {
    client = await pool.connect();
    if (type === 'total-noticias') {
      const result = await client.query(
        `
        SELECT COUNT(*) as total_noticias
        FROM noticias
        WHERE data::date BETWEEN $1 AND $2
        `,
        [from, to]
      );
      res.json({ total_noticias: parseInt(result.rows[0].total_noticias) });
    } else if (type === 'noticias-por-periodo') {
      const result = await client.query(
        `
        SELECT data, COUNT(*) as value
        FROM noticias
        WHERE data::date BETWEEN $1 AND $2
        GROUP BY data
        ORDER BY data::date ASC
        `,
        [from, to]
      );
      res.json(result.rows.map(row => ({ name: row.data, value: parseInt(row.value) })));
    } else {
      res.status(400).json({ error: 'Tipo de métrica inválido' });
    }
  } catch (error) {
    console.error('Erro ao buscar métricas:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

app.get('/pontuacao-total', async (req, res) => {
  const { from, to } = req.query;
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `
      SELECT SUM(pontos) as total_pontuacao
      FROM noticias
      WHERE data::date BETWEEN $1 AND $2
      `,
      [from, to]
    );
    res.json({ total_pontuacao: parseInt(result.rows[0].total_pontuacao) || 0 });
  } catch (error) {
    console.error('Erro ao buscar pontuação total:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

app.get('/portais-relevantes', async (req, res) => { /* ... */ });
app.get('/portais', async (req, res) => { /* ... */ });

app.get('/noticias', async (req, res) => {
  let client;
  try {
    const { from, to } = req.query;
    let queryFrom = from || '2025-03-01';
    let queryTo = to || new Date().toISOString().split('T')[0];

    console.log('Intervalo de busca na API:', { queryFrom, queryTo });

    client = await pool.connect();
    const result = await client.query(
      `
      SELECT data, portal, titulo, link, pontos, id
      FROM noticias
      WHERE data::date BETWEEN $1 AND $2
      ORDER BY data::date DESC
      `,
      [queryFrom, queryTo]
    );

    console.log('Registros de notícias encontrados na API:', result.rows.length);
    console.log('Primeiros registros (se houver):', result.rows.slice(0, 5));

    const data = result.rows.map(row => ({
      data: row.data || '',
      portal: row.portal || 'Desconhecido',
      titulo: row.titulo || 'Título Não Disponível!',
      link: row.link || '',
      pontos: row.pontos || 0,
      id: row.id
    }));

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

app.put('/noticias/:id', async (req, res) => {
  const { id } = req.params;
  const { tema } = req.body;
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `
      UPDATE noticias
      SET tema = $1
      WHERE id = $2
      RETURNING *
      `,
      [tema, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }

    console.log('Tema atualizado com sucesso:', { id, tema });
    res.json({ id, tema });
  } catch (error) {
    console.error('Erro ao atualizar o tema:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

app.get('/noticias/pontos', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `
      SELECT id, titulo, pontos
      FROM noticias
      ORDER BY id ASC
      `
    );

    console.log('Registro de pontos encontrados:', result.rows.length);
    console.log('Primeiros registros (se houver):', result.rows.slice(0, 5));

    const data = result.rows.map(row => ({
      id: row.id,
      titulo: row.titulo || 'Título Não Disponível',
      pontos: row.pontos || 0
    }));

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar pontos das notícias:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});