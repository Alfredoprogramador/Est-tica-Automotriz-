const express = require('express');
const path = require('node:path');
const { initializeDatabase, getState, saveState, DB_PATH } = require('./database');

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname)));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, database: DB_PATH });
});

app.get('/api/state', async (_request, response) => {
  try {
    const state = await getState();
    response.json(state);
  } catch (error) {
    response.status(500).json({ message: 'Erro ao carregar estado.', detail: String(error.message || error) });
  }
});

app.put('/api/state', async (request, response) => {
  try {
    const saved = await saveState(request.body || {});
    response.json(saved);
  } catch (error) {
    response.status(500).json({ message: 'Erro ao salvar estado.', detail: String(error.message || error) });
  }
});

app.get('*', (_request, response) => {
  response.sendFile(path.join(__dirname, 'index.html'));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor iniciado em http://localhost:${PORT}`);
      console.log(`Banco de dados SQLite em: ${DB_PATH}`);
    });
  })
  .catch((error) => {
    console.error('Falha ao inicializar banco de dados:', error);
    process.exit(1);
  });
