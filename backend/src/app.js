const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { requestLogger } = require('./middleware/request-logger.middleware');
const env = require('./config/env');
const { writeErrorLog } = require('./services/error-log.service');

function createApp() {
  const app = express();

  const corsOptions = env.corsOrigins.includes('*')
    ? {}
    : {
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
    };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '2mb' }));
  app.use(requestLogger);
  app.use(routes);

  app.use((error, request, response, next) => {
    console.error('[backend]', error);
    writeErrorLog({
      source: 'api',
      severity: (error.statusCode || 500) >= 500 ? 'error' : 'warning',
      message: error.message || 'Internal server error',
      stack: error.stack || null,
      metadata: {
        path: request.originalUrl,
        method: request.method,
        userId: request.user ? String(request.user._id || request.user.id || '') : null,
      },
    }).catch(() => undefined);
    response.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || 'Internal server error',
    });
  });

  return app;
}

module.exports = { createApp };
