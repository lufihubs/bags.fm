import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import { BagsFmScraper } from '../scraper/BagsFmScraper';
import { DatabaseManager } from '../database/DatabaseManager';
import { Logger } from '../utils/Logger';
import { MigratedToken, BotConfig } from '../types';

export class BagsFmBot {
  private bot: TelegramBot;
  private scraper: BagsFmScraper;
  private database: DatabaseManager;
  private logger: Logger;
  private config: BotConfig;
  private cronJob?: cron.ScheduledTask;

  constructor() {
    this.logger = new Logger();
    this.config = this.loadConfig();
    
    this.bot = new TelegramBot(this.config.telegramBotToken, { polling: true });
    this.scraper = new BagsFmScraper(this.config.bagsFmUrl);
    this.database = new DatabaseManager(this.config.databasePath);
  }

  private loadConfig(): BotConfig {
    return {
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
      telegramChatId: process.env.TELEGRAM_CHAT_ID!,
      checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || '5'),
      databasePath: process.env.DATABASE_PATH || './data/migrations.db',
      bagsFmUrl: process.env.BAGS_FM_URL || 'https://bags.fm',
      logLevel: process.env.LOG_LEVEL || 'info'
    };
  }

  async start(): Promise<void> {
    try {
      // Initialize database
      await this.database.initialize();
      this.logger.info('Database initialized');

      // Log the channel configuration
      this.logger.info(`Bot configured to send notifications to channel: ${this.config.telegramChatId}`);

      // Set up bot commands
      this.setupBotCommands();

      // Schedule periodic checks
      this.schedulePeriodicCheck();

      // Run initial check
      await this.checkForNewMigrations();

      this.logger.info('Bot started successfully');
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping bot...');
    
    if (this.cronJob) {
      this.cronJob.stop();
    }
    
    this.bot.stopPolling();
    await this.database.close();
    
    this.logger.info('Bot stopped');
  }

  private setupBotCommands(): void {
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 
        '🚀 Bags.fm Token Launch Bot is running!\n\n' +
        'I will monitor for new token launches on bags.fm and send updates to this channel.\n\n' +
        'Commands:\n' +
        '/status - Check bot status\n' +
        '/check - Manually check for new migrations\n' +
        '/stats - Show token migration statistics\n' +
        '/clear - Clear migration database (resets tracking)'
      );
    });

    this.bot.onText(/\/status/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, '✅ Bot is running and monitoring for new token migrations!');
    });

    this.bot.onText(/\/check/, async (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, '🔍 Checking for new token migrations...');
      await this.checkForNewMigrations();
    });

    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const stats = await this.database.getStats();
        this.bot.sendMessage(chatId, 
          `📊 Token Migration Statistics:\n\n` +
          `Total migrations tracked: ${stats.totalMigrations}\n` +
          `Today: ${stats.migrationsToday}\n` +
          `This week: ${stats.migrationsThisWeek}`
        );
      } catch (error) {
        this.bot.sendMessage(chatId, '❌ Failed to get statistics');
      }
    });

    this.bot.onText(/\/clear/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        await this.database.clearDatabase();
        this.bot.sendMessage(chatId, '🗑️ Database cleared successfully! All migration history has been reset.');
      } catch (error) {
        this.bot.sendMessage(chatId, '❌ Failed to clear database');
      }
    });
  }

  private schedulePeriodicCheck(): void {
    const interval = `*/${this.config.checkIntervalMinutes} * * * *`;
    this.cronJob = cron.schedule(interval, async () => {
      this.logger.debug('Running scheduled migration check');
      await this.checkForNewMigrations();
    });
    
    this.logger.info(`Scheduled checks every ${this.config.checkIntervalMinutes} minutes`);
  }

  private async checkForNewMigrations(): Promise<void> {
    try {
      this.logger.debug('Checking for new token migrations...');
      
      const launches = await this.scraper.fetchMigrations();
      const newMigrations: MigratedToken[] = [];

      for (const launch of launches) {
        const exists = await this.database.migrationExistsByDetails(launch);
        if (!exists) {
          await this.database.saveMigration(launch);
          newMigrations.push(launch);
        }
      }

      if (newMigrations.length > 0) {
        this.logger.info(`Found ${newMigrations.length} new token migrations`);
        for (const migration of newMigrations) {
          await this.sendMigrationNotification(migration);
        }
      } else {
        this.logger.debug('No new token migrations found');
      }

    } catch (error) {
      this.logger.error('Error checking for token migrations:', error);
    }
  }

  private async sendMigrationNotification(migration: MigratedToken): Promise<void> {
    try {
      const message = this.formatMigrationMessage(migration);
      
      // Send with image if available
      if (migration.image) {
        try {
          await this.bot.sendPhoto(this.config.telegramChatId, migration.image, {
            caption: message,
            parse_mode: 'HTML'
          });
        } catch (imageError) {
          // If image fails, send as regular message
          this.logger.warn(`Failed to send image for ${migration.symbol}, sending text only:`, imageError);
          await this.bot.sendMessage(this.config.telegramChatId, message, { 
            parse_mode: 'HTML',
            disable_web_page_preview: false
          });
        }
      } else {
        // Send notification to the configured channel
        await this.bot.sendMessage(this.config.telegramChatId, message, { 
          parse_mode: 'HTML',
          disable_web_page_preview: false
        });
      }
      
      this.logger.info(`Sent token migration notification to channel ${this.config.telegramChatId}: ${migration.name} (${migration.symbol})`);
    } catch (error) {
      this.logger.error('Failed to send token migration notification:', error);
    }
  }

  private formatMigrationMessage(migration: MigratedToken): string {
    let message = `🎯 <b>Token Successfully Migrated on Bags.fm!</b>\n\n`;
    message += `<b>Token:</b> ${migration.name} (${migration.symbol})\n`;
    
    if (migration.contractAddress) {
      message += `<b>Contract:</b> <code>${migration.contractAddress}</code>\n`;
    }
    
    if (migration.description) {
      message += `<b>Description:</b> ${migration.description.substring(0, 200)}${migration.description.length > 200 ? '...' : ''}\n`;
    }
    
    message += `<b>Chain:</b> Solana\n`;
    
    if (migration.creator) {
      message += `<b>Creator:</b> <code>${migration.creator}</code>\n`;
    }
    
    // Format market cap with K, M, B abbreviations
    if (migration.marketCap) {
      const formattedMcap = this.formatCurrency(migration.marketCap);
      message += `<b>💰 Market Cap:</b> $${formattedMcap}\n`;
    }
    
    if (migration.price) {
      message += `<b>💵 Price:</b> $${migration.price.toFixed(8)}\n`;
    }
    
    if (migration.volume24h) {
      const formattedVolume = this.formatCurrency(migration.volume24h);
      message += `<b>📊 24h Volume:</b> $${formattedVolume}\n`;
    }
    
    // Show total amount raised during bonding
    if (migration.totalRaised) {
      const formattedRaised = this.formatCurrency(migration.totalRaised);
      message += `<b>💰 Total Raised:</b> $${formattedRaised}\n`;
    }
    
    // Show bonding duration
    if (migration.bondingDuration) {
      const duration = this.formatDuration(migration.bondingDuration);
      message += `<b>⏱️ Bonding Duration:</b> ${duration}\n`;
    }
    
    if (migration.bondingProgress !== undefined) {
      message += `<b>🔥 Bonding Progress:</b> ${(migration.bondingProgress * 100).toFixed(1)}%\n`;
    }
    
    // Add social links if available
    const socialLinks = [];
    if (migration.website) socialLinks.push(`<a href="${migration.website}">Website</a>`);
    if (migration.twitter) socialLinks.push(`<a href="${migration.twitter}">Twitter</a>`);
    if (migration.telegram) socialLinks.push(`<a href="${migration.telegram}">Telegram</a>`);
    
    if (socialLinks.length > 0) {
      message += `\n<b>Links:</b> ${socialLinks.join(' | ')}\n`;
    }
    
    if (migration.url) {
      message += `\n<a href="${migration.url}">🔗 View on Bags.fm</a>`;
    }
    
    message += `\n\n#TokenMigration #BagsFm #Solana #${migration.symbol}`;
    
    return message;
  }

  private formatCurrency(amount: number): string {
    if (amount >= 1e9) {
      return (amount / 1e9).toFixed(2) + 'B';
    } else if (amount >= 1e6) {
      return (amount / 1e6).toFixed(2) + 'M';
    } else if (amount >= 1e3) {
      return (amount / 1e3).toFixed(2) + 'K';
    } else {
      return amount.toFixed(2);
    }
  }

  private formatDuration(hours: number): string {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} minutes`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      if (remainingHours === 0) {
        return `${days} days`;
      } else {
        return `${days}d ${remainingHours}h`;
      }
    }
  }
}
