const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Para processar requisições com corpo JSON

// Configuração de CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Origin", "X-Requested-With", "Accept"],
  })
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Rotas existentes
app.get("/metrics", async (req, res) => {
  const { type, from, to } = req.query;
  try {
    if (type === "total-noticias") {
      // Manter por compatibilidade, ajustar depois
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
          ORDER BY TO_DATE(data, 'DD/MM/YYYY') ASC
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
    res.status(500).json({ error: error.message });
  }
});

app.get("/portais-relevantes", async (req, res) => {
  /* ... */
});
app.get("/portais", async (req, res) => {
  /* ... */
});

app.get("/noticias", async (req, res) => {
  let client;
  try {
    const { from, to, mostrarIrrelevantes, after, limit = 50 } = req.query;
    let queryFrom = from || "2025-03-01";
    let queryTo = to || new Date().toISOString().split("T")[0];
    const limitNum = Math.min(parseInt(limit, 10), 100); // Limite máximo de 100

    console.log("Parâmetros recebidos:", { queryFrom, queryTo, mostrarIrrelevantes, after, limit: limitNum });

    // Validação básica
    if (limitNum <= 0) {
      return res.status(400).json({ error: "O parâmetro 'limit' deve ser um número positivo" });
    }

    client = await pool.connect();

    // Filtro de relevância
    let relevanciaFilter = "";
    if (mostrarIrrelevantes === "true") {
      relevanciaFilter = "relevancia = false";
    } else {
      relevanciaFilter = "(relevancia IS NULL OR relevancia = true)";
    }

    // Contar o total de registros
    const countResult = await client.query(
      `
        SELECT COUNT(*)
        FROM noticias
        WHERE TO_DATE(data, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')
          AND ${relevanciaFilter}
      `,
      [queryFrom, queryTo]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Parsear o cursor (after)
    let cursorDate = null;
    let cursorId = null;
    if (after) {
      const [dateStr, idStr] = after.split("_");
      if (!dateStr || !idStr) {
        return res.status(400).json({ error: "Formato inválido para o parâmetro 'after'" });
      }
      cursorDate = dateStr; // Formato YYYY-MM-DD
      cursorId = parseInt(idStr, 10);
      if (isNaN(cursorId)) {
        return res.status(400).json({ error: "ID no parâmetro 'after' deve ser um número" });
      }
    }

    // Construir a query principal
    let query = `
      SELECT data, portal, titulo, link, pontos, id, tema, avaliacao, relevancia
      FROM noticias
      WHERE TO_DATE(data, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')
        AND ${relevanciaFilter}
    `;
    const values = [queryFrom, queryTo];

    // Adicionar condição do cursor
    if (cursorDate && cursorId) {
      query += `
        AND (TO_DATE(data, 'DD/MM/YYYY') < TO_DATE($3, 'YYYY-MM-DD')
          OR (TO_DATE(data, 'DD/MM/YYYY') = TO_DATE($3, 'YYYY-MM-DD') AND id < $4))
      `;
      values.push(cursorDate, cursorId);
    }

    // Adicionar ordenação e limite
    query += `
      ORDER BY TO_DATE(data, 'DD/MM/YYYY') DESC, id DESC
      LIMIT $${values.length + 1}
    `;
    values.push(limitNum);

    // Executar a query
    const result = await client.query(query, values);

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
    }));

    // Determinar o nextCursor
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

app.put("/noticias/:id", async (req, res) => {
  const { id } = req.params;
  let { tema, avaliacao, relevancia } = req.body;

  try {
    if (
      tema === undefined &&
      avaliacao === undefined &&
      relevancia === undefined
    ) {
      return res
        .status(400)
        .json({ error: "Nenhum campo fornecido para atualização." });
    }

    const currentNoticia = await pool.query(
      "SELECT pontos FROM noticias WHERE id = $1",
      [id]
    );

    if (currentNoticia.rowCount === 0) {
      return res.status(404).json({ error: "Notícia não encontrada" });
    }

    let pontos = currentNoticia.rows[0].pontos || 0;
    const pontosBrutos = Math.abs(pontos);

    if (avaliacao !== undefined) {
      pontos = avaliacao === "Negativa" ? -pontosBrutos : pontosBrutos;
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (tema !== undefined) {
      updates.push(`tema = $${paramIndex}`);
      values.push(tema);
      paramIndex++;
    }

    if (avaliacao !== undefined) {
      updates.push(`avaliacao = $${paramIndex}`);
      values.push(avaliacao);
      paramIndex++;

      updates.push(`pontos = $${paramIndex}`);
      values.push(pontos);
      paramIndex++;
    }

    if (relevancia !== undefined) {
      updates.push(`relevancia = $${paramIndex}`);
      values.push(relevancia); // true, false ou null
      paramIndex++;
    }

    values.push(id);

    const query = `
      UPDATE noticias
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar a notícia:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Nova rota para buscar os pontos das notícias
app.get("/noticias/pontos", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT id, titulo, pontos
        FROM noticias
        ORDER BY id ASC
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

// (Opcional) Rota para buscar pontos de uma notícia específica por ID
/*
 app.get('/noticias/:id/pontos', async (req, res) => {
   const { id } = req.params;
 
   try {
     const result = await pool.query(
       `
         SELECT id, titulo, pontos
         FROM noticias
         WHERE id = $1
       `,
       [id]
     );
 
     if (result.rowCount === 0) {
       return res.status(404).json({ error: 'Notícia não encontrada' });
     }
 
     const data = {
       id: result.rows[0].id,
       titulo: result.rows[0].titulo || 'Título Não Disponível',
       pontos: result.rows[0].pontos || 0
     };
 
     console.log('Pontos da notícia encontrados:', data);
     res.json(data);
   } catch (error) {
     console.error('Erro ao buscar pontos da notícia:', error.message);
     console.error('Stack trace:', error.stack);
     res.status(500).json({ error: error.message });
   }
 });
 */

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
