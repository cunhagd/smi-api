const express = require('express');
const sql = require('mssql');
const app = express();
const port = process.env.PORT || 3000;

// Função para parsear a string de conexão ODBC
function parseConnectionString(connectionString) {
  const config = {};
  const parts = connectionString.split(';');
  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      config[key.toLowerCase()] = value;
    }
  });
  return {
    user: config.uid,
    password: config.pwd,
    server: config.server.replace('tcp:', ''), // Remove o prefixo "tcp:"
    database: config.database,
    port: parseInt(config.server.split(',')[1] || 1433), // Extrai a porta (ex.: 1433)
    options: {
      encrypt: config.encrypt === 'yes',
      trustServerCertificate: config.trustservercertificate === 'no' ? false : true
    }
  };
}

// Configuração da conexão com o Azure SQL Database
const connectionString = process.env.DATABASE_URL;
const dbConfig = parseConnectionString(connectionString);

app.use(express.json()); // Para processar requisições com corpo JSON
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Rotas existentes
app.get('/metrics', async (req, res) => {
  const { type, from, to } = req.query;
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    if (type === 'total-noticias') {
      const result = await pool.request()
        .input('from', sql.Date, from)
        .input('to', sql.Date, to)
        .query(`
          SELECT COUNT(*) as total_noticias
          FROM noticias
          WHERE CAST(data AS DATE) BETWEEN @from AND @to
        `);
      res.json({ total_noticias: parseInt(result.recordset[0].total_noticias) });
    } else if (type === 'noticias-por-periodo') {
      const result = await pool.request()
        .input('from', sql.Date, from)
        .input('to', sql.Date, to)
        .query(`
          SELECT data, COUNT(*) as value
          FROM noticias
          WHERE CAST(data AS DATE) BETWEEN @from AND @to
          GROUP BY data
          ORDER BY CAST(data AS DATE) ASC
        `);
      res.json(result.recordset.map(row => ({ name: row.data, value: parseInt(row.value) })));
    } else {
      res.status(400).json({ error: 'Tipo de métrica inválido' });
    }
  } catch (error) {
    console.error('Erro ao buscar métricas:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (pool) pool.close();
  }
});

app.get('/pontuacao-total', async (req, res) => {
  const { from, to } = req.query;
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('from', sql.Date, from)
      .input('to', sql.Date, to)
      .query(`
        SELECT SUM(pontos) as total_pontuacao
        FROM noticias
        WHERE CAST(data AS DATE) BETWEEN @from AND @to
      `);
    res.json({ total_pontuacao: parseInt(result.recordset[0].total_pontuacao) || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (pool) pool.close();
  }
});

app.get('/portais-relevantes', async (req, res) => { /* ... */ });
app.get('/portais', async (req, res) => { /* ... */ });

app.get('/noticias', async (req, res) => {
  let pool;
  try {
    const { from, to } = req.query;
    let queryFrom = from || '2025-03-01';
    let queryTo = to || new Date().toISOString().split('T')[0];

    console.log('Intervalo de busca na API:', { queryFrom, queryTo });

    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('queryFrom', sql.Date, queryFrom)
      .input('queryTo', sql.Date, queryTo)
      .query(`
        SELECT data, portal, titulo, link, pontos, id
        FROM noticias
        WHERE CAST(data AS DATE) BETWEEN @queryFrom AND @queryTo
        ORDER BY CAST(data AS DATE) DESC
      `);

    console.log('Registros de notícias encontrados na API:', result.recordset.length);
    console.log('Primeiros registros (se houver):', result.recordset.slice(0, 5));

    const data = result.recordset.map(row => ({
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
    if (pool) pool.close();
  }
});

app.put('/noticias/:id', async (req, res) => {
  const { id } = req.params;
  const { tema } = req.body;
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('tema', sql.NVarChar, tema)
      .input('id', sql.Int, id)
      .query(`
        UPDATE noticias
        SET tema = @tema
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Notícia não encontrada' });
    }

    console.log('Tema atualizado com sucesso:', { id, tema });
    res.json({ id, tema });
  } catch (error) {
    console.error('Erro ao atualizar o tema:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  } finally {
    if (pool) pool.close();
  }
});

app.get('/noticias/pontos', async (req, res) => {
  let pool;
  try {
    pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .query(`
        SELECT id, titulo, pontos
        FROM noticias
        ORDER BY id ASC
      `);

    console.log('Registro de pontos encontrados:', result.recordset.length);
    console.log('Primeiros registros (se houver):', result.recordset.slice(0, 5));

    const data = result.recordset.map(row => ({
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
    if (pool) pool.close();
  }
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});