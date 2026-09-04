import app from './app';
import { env, isDevelopment } from './config/env';
import { initializeFirebase, isFirebaseConfigured } from './config/firebase';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    initializeFirebase();
    // Auto-seed Firestore with frontend mock data if empty (idempotent)
    // Runs in background — failures only warn, server still starts.
    // In mock-memory mode this is a no-op (returns skippedReason).
    try {
      const { seedDatabase } = await import('./utils/seed');
      seedDatabase().then(r => {
        if (r.products || r.categories || r.restaurants || r.offers) {
          logger.info('Auto-seed completed', r);
        } else if (r.skippedReason) {
          logger.info(`Auto-seed skipped: ${r.skippedReason}`);
        }
      }).catch(e => logger.warn('Auto-seed failed', { error: (e as Error).message }));
    } catch (e: any) {
      logger.warn('Seed import failed', { error: e.message });
    }

    const port = env.PORT;

    app.listen(port, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🍔 Foody Backend');
      console.log('='.repeat(50));
      console.log(`Environment : ${env.NODE_ENV}`);
      console.log(`Port        : ${port}`);
      console.log(`Health      : http://localhost:${port}/health`);
      console.log(`API Base    : http://localhost:${port}/api/v1`);
      console.log(`Firebase    : ${isFirebaseConfigured() ? 'connected' : 'MOCK mode (configure .env to enable)'}`);
      console.log('='.repeat(50) + '\n');

      logger.info('Foody backend started', {
        port,
        env: env.NODE_ENV,
        firebase: isFirebaseConfigured() ? 'connected' : 'mock',
      });

      if (!isFirebaseConfigured() && isDevelopment) {
        logger.warn('Running without Firebase credentials – OTP/magic-link will log to console, auth will use mock tokens');
      }
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', { error: reason?.message || reason, stack: reason?.stack });
  // Don't exit; log and continue for resilience
});

bootstrap();

export default app;
