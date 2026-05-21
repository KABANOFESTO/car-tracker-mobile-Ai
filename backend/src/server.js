const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const { createApp } = require('./app');
const { ensureAdminSeeded } = require('./services/auth.service');
const { startDispatcher } = require('./services/dispatcher.service');

async function startServer() {
  await connectDatabase();
  await ensureAdminSeeded();
  const app = createApp();

  app.listen(env.port, async () => {
    console.log(`[backend] listening on http://0.0.0.0:${env.port}`);
    await startDispatcher();
    console.log(`[backend] dispatcher polling every ${env.dispatcherPollIntervalMs} ms`);
  });
}

module.exports = { startServer };
