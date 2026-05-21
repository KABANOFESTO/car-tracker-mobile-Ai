const express = require('express');
const cors = require('cors');
const routes = require('./routes');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(routes);

  app.use((error, request, response, next) => {
    console.error('[backend]', error);
    response.status(500).json({
      ok: false,
      error: error.message || 'Internal server error',
    });
  });

  return app;
}

module.exports = { createApp };
