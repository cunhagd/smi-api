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

    console.log("Parâmetros recebidos:", { from, to, mostrarIrrelevantes, mostrarEstrategicas, after, limit: limitNum });
    console.log("queryFrom:", queryFrom, "queryTo:", queryTo);

    if (limitNum <= 0) {
      return res.status(400).json({ error: "O parâmetro 'limit' deve ser um número positivo" });
    }

    console.log("Conectando ao banco com DATABASE_URL:", process.env.DATABASE_URL);

    client = await pool.connect();

    let filter = "";
    if (mostrarEstrategicas === "true") {
      filter = "n.estrategica = true";
    } else if (mostrarIrrelevantes === "true") {
      filter = "n.relevancia = false";
    } else {
      filter = "(n.relevancia IS NULL OR n.relevancia = true)";
    }
    console.log("Filtro aplicado:", filter);

    const countResult = await client.query(
      `
        SELECT COUNT(*)
        FROM noticias n
        WHERE TO_DATE(n.data, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')
          AND ${filter}
          AND n.data IS NOT NULL
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
      SELECT subquery.*, 
             COALESCE(subquery.categoria, se.categoria) AS categoria,
             COALESCE(subquery.subcategoria, se.subcategoria) AS subcategoria
      FROM (
        SELECT n.data, n.portal, n.titulo, n.link, n.pontos, n.id, n.tema, n.avaliacao, n.relevancia, n.estrategica,
               n.categoria, n.subcategoria,
               TO_DATE(n.data, 'DD/MM/YYYY') AS parsed_date
        FROM noticias n
        WHERE TO_DATE(n.data, 'DD/MM/YYYY') BETWEEN TO_DATE($1, 'YYYY-MM-DD') AND TO_DATE($2, 'YYYY-MM-DD')
          AND ${filter}
          AND n.data IS NOT NULL
        ORDER BY TO_DATE(n.data, 'DD/MM/YYYY') DESC, n.id DESC
      ) AS subquery
      LEFT JOIN semana_estrategica se
      ON TO_DATE(subquery.data, 'DD/MM/YYYY') BETWEEN TO_DATE(se.data_inicial, 'DD/MM/YYYY') AND TO_DATE(se.data_final, 'DD/MM/YYYY')
    `;
    const values = [queryFrom, queryTo];

    if (cursorDate && cursorId) {
      query += `
        WHERE (TO_DATE(subquery.data, 'DD/MM/YYYY') < TO_DATE($3, 'YYYY-MM-DD')
          OR (TO_DATE(subquery.data, 'DD/MM/YYYY') = TO_DATE($3, 'YYYY-MM-DD') AND subquery.id < $4))
      `;
      values.push(cursorDate, cursorId);
    }

    query += `
      LIMIT $${values.length + 1}
    `;
    values.push(limitNum);

    console.log("Executando query:", query);
    console.log("Valores:", values);

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

app.put("/noticias/:id", async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { id } = req.params;
    let { tema, avaliacao, relevancia, estrategica, categoria, subcategoria } = req.body;

    if (
      tema === undefined &&
      avaliacao === undefined &&
      relevancia === undefined &&
      estrategica === undefined &&
      categoria === undefined &&
      subcategoria === undefined
    ) {
      return res.status(400).json({ error: "Nenhum campo fornecido para atualização." });
    }

    const currentNoticia = await client.query(
      "SELECT pontos, data FROM noticias WHERE id = $1",
      [id]
    );

    if (currentNoticia.rowCount === 0) {
      return res.status(404).json({ error: "Notícia não encontrada" });
    }

    let pontos = currentNoticia.rows[0].pontos || 0;
    const pontosBrutos = Math.abs(pontos);
    const noticiaData = currentNoticia.rows[0].data;

    let pontosNew;
    if (avaliacao !== undefined) {
      if (avaliacao === null) {
        pontosNew = null;
      } else {
        pontosNew = avaliacao === "Negativa" ? -pontosBrutos : pontosBrutos;
      }
    }

    // Se estrategica for true, buscar categoria e subcategoria da semana_estrategica
    let autoCategoria = categoria;
    let autoSubcategoria = subcategoria;
    if (estrategica === true && (categoria === undefined || subcategoria === undefined)) {
      const semanaResult = await client.query(
        `
          SELECT categoria, subcategoria
          FROM semana_estrategica
          WHERE TO_DATE($1, 'DD/MM/YYYY') BETWEEN TO_DATE(data_inicial, 'DD/MM/YYYY') AND TO_DATE(data_final, 'DD/MM/YYYY')
        `,
        [noticiaData]
      );
      if (semanaResult.rowCount > 0) {
        autoCategoria = autoCategoria || semanaResult.rows[0].categoria;
        autoSubcategoria = autoSubcategoria || semanaResult.rows[0].subcategoria;
      }
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
      values.push(pontosNew);
      paramIndex++;
    }

    if (relevancia !== undefined) {
      updates.push(`relevancia = $${paramIndex}`);
      values.push(relevancia);
      paramIndex++;
    }

    if (estrategica !== undefined) {
      updates.push(`estrategica = $${paramIndex}`);
      values.push(estrategica);
      paramIndex++;
    }

    if (autoCategoria !== undefined) {
      updates.push(`categoria = $${paramIndex}`);
      values.push(autoCategoria);
      paramIndex++;
    }

    if (autoSubcategoria !== undefined) {
      updates.push(`subcategoria = $${paramIndex}`);
      values.push(autoSubcategoria);
      paramIndex++;
    }

    values.push(id);

    const query = `
      UPDATE noticias
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao atualizar a notícia:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

// Nova rota para buscar os pontos das notícias
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

    const dataParam = req.query.data; // Obtém o parâmetro 'data' da query string
    let queryText;
    let queryValues = [];

    if (dataParam) {
      // Valida o formato do parâmetro 'data' (deve ser DD/MM/YYYY)
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(dataParam)) {
        return res.status(400).json({ error: "Parâmetro 'data' deve estar no formato DD/MM/YYYY" });
      }

      // Converte a data para o formato YYYY-MM-DD para comparação
      const [day, month, year] = dataParam.split("/");
      const dataFormatted = `${year}-${month}-${day}`; // Formato YYYY-MM-DD

      queryText = `
        SELECT id, data_inicial, data_final, ciclo, categoria, subcategoria
        FROM semana_estrategica
        WHERE TO_DATE($1, 'YYYY-MM-DD') BETWEEN TO_DATE(data_inicial, 'DD/MM/YYYY') AND TO_DATE(data_final, 'DD/MM/YYYY')
        ORDER BY TO_DATE(data_inicial, 'DD/MM/YYYY') DESC
      `;
      queryValues = [dataFormatted];
    } else {
      // Se não houver parâmetro 'data', retorna todas as semanas
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

app.put("/semana-estrategica/:id", async (req, res) => {
  const { id } = req.params;
  const { data_inicial, data_final, ciclo, categoria, subcategoria } = req.body;

  const client = await pool.connect();
  try {
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
    client.release();
  }
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});