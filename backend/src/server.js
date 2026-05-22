const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const { createApp } = require('./app');
const { ensureAdminSeeded } = require('./services/auth.service');
const { startDispatcher } = require('./services/dispatcher.service');
const { purgeExpiredRecords } = require('./services/maintenance.service');

async function startServer() {
  await connectDatabase();
  await ensureAdminSeeded();
  await purgeExpiredRecords();
  const app = createApp();

  app.listen(env.port, async () => {
    console.log(`[backend] listening on http://0.0.0.0:${env.port}`);
    await startDispatcher();
    setInterval(() => {
      purgeExpiredRecords().catch((error) => {
        console.error('[maintenance]', error.message);
      });
    }, 6 * 60 * 60 * 1000);
    console.log(`[backend] dispatcher polling every ${env.dispatcherPollIntervalMs} ms`);
  });
}

module.exports = { startServer };
