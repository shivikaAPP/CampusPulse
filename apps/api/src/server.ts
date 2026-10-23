import { buildApp } from './app.js';
import { client, ensureTables } from './db/client.js';
import { config } from './config.js';

async function start() {
  try {
    // Ensure SQLite database tables are created
    await ensureTables(client);

    const app = buildApp();

    await app.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });

    app.log.info(`CampusPlus API listening at http://0.0.0.0:${config.PORT}`);

    const shutdown = async (signal: string) => {
      app.log.info(`Received ${signal}. Shutting down gracefully...`);
      try {
        await app.close();
        client.close();
        process.exit(0);
      } catch (err) {
        app.log.error(err, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

start();
