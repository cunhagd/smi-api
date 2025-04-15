const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

// Middleware
app.use(express.json()); // Para processar requisições com corpo JSON

// Configuração de CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Origin", "X-Requested-With", "Accept"],
  })
);

// Configuração do banco de dados
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Erro: DATABASE_URL não está definida. Verifique o arquivo .env ou as variáveis de ambiente.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Ativar SSL em produção
});

// Rotas existentes
app.get("/metrics", async (req, res) => {
  const { type, from, to } = req.query;
  try {
    if (type === "total-noticias") {
      const result = await pool.query(
        `
          SELECT COUNT(*) as total_noticias
          FROM noticias
          WHERE TO_DATE(data, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')
        `,
        [from, to]
      );
      res.json({ total_noticias: parseInt(result.rows[0].total_noticias) });
    } else if (type === "noticias-por-periodo") {
      const result = await pool.query(
        `
          SELECT data, COUNT(*) as value
          FROM noticias
          WHERE TO_DATE(data, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')
          GROUP BY data
          ORDER BY TO_DATE(data, 'DD/MM/YYYY') DESC
        `,
        [from, to]
      );
      res.json(
        result.rows.map((row) => ({
          name: row.data,
          value: parseInt(row.value),
        }))
      );
    } else {
      res.status(400).json({ error: "Tipo de métrica inválido" });
    }
  } catch (error) {
    console.error("Erro ao buscar métricas:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/pontuacao-total", async (req, res) => {
  const { from, to } = req.query;
  try {
    const result = await pool.query(
      `
        SELECT SUM(pontos) as total_pontuacao
        FROM noticias
        WHERE TO_DATE(data, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')
      `,
      [from, to]
    );
    res.json({
      total_pontuacao: parseInt(result.rows[0].total_pontuacao) || 0,
    });
  } catch (error) {
    console.error("Erro ao buscar pontuação total:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/portais-relevantes", async (req, res) => {
  // Placeholder para a rota /portais-relevantes
  res.status(501).json({ error: "Rota não implementada" });
});

app.get("/portais", async (req, res) => {
  // Placeholder para a rota /portais
  res.status(501).json({ error: "Rota não implementada" });
});

app.get("/noticias", async (req, res) => {
  let client;
  try {
    const { from, to, mostrarIrrelevantes, mostrarEstrategicas, after, limit = 50 } = req.query;
    let queryFrom = from || "2025-03-01";
    let queryTo = to || new Date().toISOString().split("T")[0];
    const limitNum = Math.min(parseInt(limit, 10), 100);

    console.log("Parâmetros recebidos:", { queryFrom, queryTo, mostrarIrrelevantes, mostrarEstrategicas, after, limit: limitNum });

    if (limitNum <= 0) {
      return res.status(400).json({ error: "O parâmetro 'limit' deve ser um número positivo" });
    }

    client = await pool.connect();

    let filter = "";
    if (mostrarEstrategicas === "true") {
      filter = "n.estrategica = true";
    } else if (mostrarIrrelevantes === "true") {
      filter = "n.relevancia = false";
    } else {
      filter = "(n.relevancia IS NULL OR n.relevancia = true)";
    }

    const countResult = await client.query(
      `
        SELECT COUNT(*)
        FROM noticias n
        WHERE TO_DATE(n.data, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')
          AND ${filter}
      `,
      [queryFrom, queryTo]
    );
    const total = parseInt(countResult.rows[0].count, 10);
    console.log("Total de notícias encontradas:", total);

    let cursorDate = null;
    let cursorId = null;
    if (after) {
      const [dateStr, idStr] = after.split("_");
      if (!dateStr || !idStr) {
        return res.status(400).json({ error: "Formato inválido para o parâmetro 'after'" });
      }
      cursorDate = dateStr;
      cursorId = parseInt(idStr, 10);
      if (isNaN(cursorId)) {
        return res.status(400).json({ error: "ID no parâmetro 'after' deve ser um número" });
      }
    }

    let query = `
      SELECT n.data, n.portal, n.titulo, n.link, n.pontos, n.id, n.tema, n.avaliacao, n.relevancia, n.estrategica,
             COALESCE(n.categoria, se.categoria) AS categoria,
             COALESCE(n.subcategoria, se.subcategoria) AS subcategoria
      FROM noticias n
      LEFT JOIN semana_estrategica se
      ON TO_DATE(n.data, 'DD/MM/YYYY') BETWEEN TO_DATE(se.data_inicial, 'DD/MM/YYYY') AND TO_DATE(se.data_final, 'DD/MM/YYYY')
      WHERE TO_DATE(n.data, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')
        AND ${filter}
    `;
    const values = [queryFrom, queryTo];

    if (cursorDate && cursorId) {
      query += `
        AND (TO_DATE(n.data, 'DD/MM/YYYY') < TO_DATE($3, 'YYYY-MM-DD')
          OR (TO_DATE(n.data, 'DD/MM/YYYY') = TO_DATE($3, 'YYYY-MM-DD') AND n.id < $4))
      `;
      values.push(cursorDate, cursorId);
    }

    query += `
      ORDER BY TO_DATE(n.data, 'DD/MM/YYYY') DESC, n.id DESC
      LIMIT $${values.length + 1}
    `;
    values.push(limitNum);

    const result = await client.query(query, values);
    console.log("Dados brutos retornados do banco (primeiras 3 linhas):", result.rows.slice(0, 3));

    const data = result.rows.map((row) => ({
      data: row.data || "",
      portal: row.portal || "Desconhecido",
      titulo: row.titulo || "Título Não Disponível!",
      link: row.link || "",
      pontos: row.pontos || 0,
      id: row.id,
      tema: row.tema || "",
      avaliacao: row.avaliacao || "",
      relevancia: row.relevancia,
      estrategica: row.estrategica,
      categoria: row.categoria || null,
      subcategoria: row.subcategoria || null,
    }));

    let nextCursor = null;
    if (data.length === limitNum) {
      const lastItem = data[data.length - 1];
      const lastDate = new Date(lastItem.data.split("/").reverse().join("-")).toISOString().split("T")[0];
      nextCursor = `${lastDate}_${lastItem.id}`;
    }

    res.json({ data, nextCursor, total });
  } catch (error) {
    console.error("Erro ao buscar notícias:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

// Rota para atualizar notícias (unificada)
app.put("/noticias/:id", async (req, res) => {
  const { id } = req.params;
  const { estrategica, relevancia, avaliacao, ...otherFields } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN'); // Inicia uma transação

    console.log(`Recebendo requisição para atualizar notícia ID ${id}:`, { estrategica, relevancia, avaliacao, otherFields });

    // Se a notícia estiver sendo marcada como estratégica
    if (estrategica === true) {
      const noticiaResult = await client.query(
        `SELECT data FROM noticias WHERE id = $1`,
        [id]
      );

      if (noticiaResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: "Notícia não encontrada" });
      }

      const dataNoticia = noticiaResult.rows[0].data;
      console.log(`Notícia ID ${id} com data ${dataNoticia} marcada como estratégica`);

      const semanaResult = await client.query(
        `SELECT categoria, subcategoria FROM semana_estrategica 
         WHERE TO_DATE($1, 'DD/MM/YYYY') BETWEEN 
         TO_DATE(data_inicial, 'DD/MM/YYYY') AND TO_DATE(data_final, 'DD/MM/YYYY')`,
        [dataNoticia]
      );

      if (semanaResult.rows.length > 0) {
        const { categoria, subcategoria } = semanaResult.rows[0];
        console.log(`Semana estratégica encontrada para a data ${dataNoticia}: categoria=${categoria}, subcategoria=${subcategoria}`);

        const updateResult = await client.query(
          `UPDATE noticias 
           SET estrategica = $1, categoria = $2, subcategoria = $3
           WHERE id = $4
           RETURNING *`,
          [estrategica, categoria, subcategoria, id]
        );

        console.log(`Notícia ID ${id} atualizada com sucesso:`, updateResult.rows[0]);
        // Após atualizar, ajustaremos pontos_new abaixo
      } else {
        console.log(`Nenhuma semana estratégica encontrada para a data ${dataNoticia}`);
      }
    }

    // Atualização normal dos outros campos
    const fields = { estrategica, relevancia, avaliacao, ...otherFields };
    const keys = Object.keys(fields).filter(key => fields[key] !== undefined);

    if (keys.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Nenhum campo válido para atualização" });
    }

    const setClauses = keys.map((key, i) => {
      if (fields[key] === null) {
        return `${key} = NULL`;
      }
      return `${key} = $${i + 1}`;
    }).join(', ');

    const values = keys
      .filter(key => fields[key] !== null)
      .map(key => fields[key]);

    const query = `
      UPDATE noticias
      SET ${setClauses}
      WHERE id = $${values.length + 1}
      RETURNING *
    `;

    const result = await client.query(query, [...values, id]);
    console.log(`Notícia ID ${id} atualizada (atualização normal):`, result.rows[0]);

    // Após atualizar os campos, ajustamos a coluna pontos_new
    const updatedNoticia = result.rows[0];
    const pontos = updatedNoticia.pontos || 0;
    const avaliacaoAtual = updatedNoticia.avaliacao;

    let pontosNew = null;
    if (avaliacaoAtual === null) {
      pontosNew = null; // Se avaliacao for null, pontos_new deve ser null
    } else if (avaliacaoAtual === 'Negativa') {
      pontosNew = -Math.abs(pontos); // Se avaliacao for Negativa, pontos_new é o valor negativo
    } else if (avaliacaoAtual === 'Positiva' || avaliacaoAtual === 'Neutra') {
      pontosNew = pontos; // Se avaliacao for Positiva ou Neutra, pontos_new é igual a pontos
    }

    // Atualiza a coluna pontos_new
    await client.query(
      `
        UPDATE noticias
        SET pontos_new = $1
        WHERE id = $2
      `,
      [pontosNew, id]
    );

    console.log(`Coluna pontos_new atualizada para notícia ID ${id}: pontos_new = ${pontosNew}`);

    // Atualiza o objeto de resposta para incluir pontos_new
    const finalResult = await client.query(
      `
        SELECT * FROM noticias WHERE id = $1
      `,
      [id]
    );

    await client.query('COMMIT');
    res.json(finalResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Erro ao atualizar notícia:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

// Rota para buscar os pontos das notícias
app.get("/noticias/pontos", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, titulo, pontos
        FROM noticias
        ORDER BY id DESC
      `
    );

    console.log("Registro de pontos encontrados:", result.rows.length);
    console.log("Primeiros registros (se houver):", result.rows.slice(0, 5));

    const data = result.rows.map((row) => ({
      id: row.id,
      titulo: row.titulo || "Título Não Disponível",
      pontos: row.pontos || 0,
    }));

    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar pontos das notícias:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Rota para Semana Estratégica (GET)
app.get("/semana-estrategica", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    console.log("Conexão com o banco estabelecida para buscar semanas estratégicas");

    const dataParam = req.query.data;
    let queryText;
    let queryValues = [];

    if (dataParam) {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(dataParam)) {
        return res.status(400).json({ error: "Parâmetro 'data' deve estar no formato DD/MM/YYYY" });
      }

      const [day, month, year] = dataParam.split("/");
      const dataFormatted = `${year}-${month}-${day}`;

      queryText = `
        SELECT id, data_inicial, data_final, ciclo, categoria, subcategoria
        FROM semana_estrategica
        WHERE TO_DATE($1, 'YYYY-MM-DD') BETWEEN TO_DATE(data_inicial, 'DD/MM/YYYY') AND TO_DATE(data_final, 'DD/MM/YYYY')
        ORDER BY TO_DATE(data_inicial, 'DD/MM/YYYY') DESC
      `;
      queryValues = [dataFormatted];
    } else {
      queryText = `
        SELECT id, data_inicial, data_final, ciclo, categoria, subcategoria
        FROM semana_estrategica
        ORDER BY TO_DATE(data_inicial, 'DD/MM/YYYY') DESC
      `;
    }

    const result = await client.query(queryText, queryValues);
    console.log("Semanas estratégicas encontradas:", result.rows);

    const data = result.rows.map((row) => ({
      id: row.id,
      data_inicial: row.data_inicial,
      data_final: row.data_final,
      ciclo: row.ciclo,
      categoria: row.categoria || null,
      subcategoria: row.subcategoria || null,
    }));

    res.json({ data });
  } catch (error) {
    console.error("Erro ao buscar semanas estratégicas:", error.message, error.stack);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
    console.log("Conexão com o banco liberada");
  }
});

// Rota para Semana Estratégica (POST)
app.post("/semana-estrategica", async (req, res) => {
  const { data_inicial, data_final, ciclo, categoria, subcategoria } = req.body;

  if (!data_inicial || !data_final || !ciclo) {
    return res.status(400).json({ error: "Campos obrigatórios: data_inicial, data_final, ciclo" });
  }

  let client;
  try {
    client = await pool.connect();
    console.log("Conexão com o banco estabelecida para cadastrar semana estratégica");

    // Validação do formato das datas
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(data_inicial) || !dateRegex.test(data_final)) {
      return res.status(400).json({ error: "As datas devem estar no formato DD/MM/YYYY" });
    }

    // Converter as datas para o formato de comparação (ignorando horário)
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    const newStartDate = parseDate(data_inicial);
    const newEndDate = parseDate(data_final);

    if (newStartDate > newEndDate) {
      return res.status(400).json({ error: "A data inicial não pode ser posterior à data final" });
    }

    // Buscar semanas existentes e verificar sobreposição
    const existingSemanas = await client.query(
      `
        SELECT id, data_inicial, data_final, ciclo
        FROM semana_estrategica
      `
    );

    for (const semana of existingSemanas.rows) {
      const existingStartDate = parseDate(semana.data_inicial);
      const existingEndDate = parseDate(semana.data_final);

      // Verificar sobreposição (considerando que datas iguais também são sobreposição)
      const noOverlap =
        newStartDate.getTime() > existingEndDate.getTime() ||
        newEndDate.getTime() < existingStartDate.getTime();

      if (!noOverlap) {
        return res.status(400).json({
          error: `As datas selecionadas se sobrepõem a uma semana estratégica existente (ID: ${semana.id}, Ciclo: ${semana.ciclo}, de ${semana.data_inicial} a ${semana.data_final}). Escolha datas fora desse intervalo.`,
        });
      }
    }

    // Se não houver sobreposição, prosseguir com o cadastro
    const result = await client.query(
      `
        INSERT INTO semana_estrategica (data_inicial, data_final, ciclo, categoria, subcategoria)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [data_inicial, data_final, ciclo, categoria, subcategoria]
    );
    console.log("Semana estratégica cadastrada:", result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao cadastrar semana estratégica:", error.message, error.stack);
    res.status(error.status || 500).json({ error: error.message });
  } finally {
    if (client) client.release();
    console.log("Conexão com o banco liberada");
  }
});

// Rota para Semana Estratégica (PUT)
app.put("/semana-estrategica/:id", async (req, res) => {
  const { id } = req.params;
  const { data_inicial, data_final, ciclo, categoria, subcategoria } = req.body;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Validação do formato das datas
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(data_inicial) || !dateRegex.test(data_final)) {
      return res.status(400).json({ error: "As datas devem estar no formato DD/MM/YYYY" });
    }

    // Converter as datas para o formato de comparação (ignorando horário)
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    const newStartDate = parseDate(data_inicial);
    const newEndDate = parseDate(data_final);

    if (newStartDate > newEndDate) {
      return res.status(400).json({ error: "A data inicial não pode ser posterior à data final" });
    }

    // Buscar semanas existentes e verificar sobreposição (excluindo a semana atual)
    const existingSemanas = await client.query(
      `
        SELECT id, data_inicial, data_final, ciclo
        FROM semana_estrategica
        WHERE id != $1
      `,
      [id]
    );

    for (const semana of existingSemanas.rows) {
      const existingStartDate = parseDate(semana.data_inicial);
      const existingEndDate = parseDate(semana.data_final);

      // Verificar sobreposição (considerando que datas iguais também são sobreposição)
      const noOverlap =
        newStartDate.getTime() > existingEndDate.getTime() ||
        newEndDate.getTime() < existingStartDate.getTime();

      if (!noOverlap) {
        return res.status(400).json({
          error: `As datas selecionadas se sobrepõem a uma semana estratégica existente (ID: ${semana.id}, Ciclo: ${semana.ciclo}, de ${semana.data_inicial} a ${semana.data_final}). Escolha datas fora desse intervalo.`,
        });
      }
    }

    // Atualiza a semana estratégica
    const updateSemana = await client.query(
      `UPDATE semana_estrategica SET
        data_inicial = $1,
        data_final = $2,
        ciclo = $3,
        categoria = $4,
        subcategoria = $5
      WHERE id = $6
      RETURNING *`,
      [data_inicial, data_final, ciclo, categoria, subcategoria, id]
    );

    // Atualiza as notícias relacionadas
    await client.query(
      `UPDATE noticias n
       SET 
         categoria = se.categoria,
         subcategoria = se.subcategoria
       FROM semana_estrategica se
       WHERE 
         TO_DATE(n.data, 'DD/MM/YYYY') BETWEEN TO_DATE(se.data_inicial, 'DD/MM/YYYY') AND TO_DATE(se.data_final, 'DD/MM/YYYY')
         AND se.id = $1`,
      [id]
    );

    await client.query('COMMIT');
    res.json(updateSemana.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Erro ao atualizar semana:", error.message);
    res.status(error.status || 500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

// Inicializar o servidor
app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});