import dotenv from 'dotenv';
import { BagsFmBot } from './bot/BagsFmBot';
import { Logger } from './utils/Logger';

// Load environment variables
dotenv.config();

const logger = new Logger();

async function main() {
  try {
    logger.info('Starting Bags.fm Migration Bot...');
    
    // Validate required environment variables
    const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Initialize and start the bot
    const bot = new BagsFmBot();
    await bot.start();
    
    logger.info('Bot started successfully!');
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await bot.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start bot:', error);
    console.error('Full error details:', error);
    process.exit(1);
  }
}

main();
