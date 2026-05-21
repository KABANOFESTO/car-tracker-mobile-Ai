const { startServer } = require('./src/server');

startServer().catch((error) => {
  console.error('[backend] failed to start', error);
  process.exit(1);
});
