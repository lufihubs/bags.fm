import path from 'path';
import fs from 'fs/promises';
import { Logger } from '../utils/Logger';
import { MigratedToken } from '../types';

interface DatabaseData {
  migrations: MigratedToken[];
  lastUpdated: string;
}

export class DatabaseManager {
  private dbPath: string;
  private logger: Logger;
  private data: DatabaseData;

  constructor(dbPath: string) {
    this.dbPath = dbPath.replace('.db', '.json'); // Use JSON instead of SQLite
    this.logger = new Logger();
    this.data = {
      migrations: [],
      lastUpdated: new Date().toISOString()
    };
  }

  async initialize(): Promise<void> {
    try {
      // Ensure the directory exists
      const dir = path.dirname(this.dbPath);
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }

      // Load existing data if file exists
      try {
        const fileContent = await fs.readFile(this.dbPath, 'utf-8');
        this.data = JSON.parse(fileContent);
        this.logger.info(`Loaded ${this.data.migrations.length} existing migrations from database`);
      } catch (error) {
        // File doesn't exist or is corrupted, start with empty data
        this.logger.info('Starting with empty database');
        await this.saveData();
      }

      this.logger.info('Database initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async saveData(): Promise<void> {
    try {
      this.data.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Failed to save database:', error);
      throw error;
    }
  }

  async saveMigration(migration: MigratedToken): Promise<void> {
    try {
      // Remove existing migration with same ID if it exists
      this.data.migrations = this.data.migrations.filter(m => m.id !== migration.id);
      
      // Add the new migration
      this.data.migrations.push({
        ...migration,
        migrationDate: new Date(migration.migrationDate) // Ensure it's a proper Date object
      });

      // Sort by migration date (newest first)
      this.data.migrations.sort((a, b) => 
        new Date(b.migrationDate).getTime() - new Date(a.migrationDate).getTime()
      );

      await this.saveData();
      this.logger.debug(`Saved migration: ${migration.name} (${migration.symbol})`);
    } catch (error) {
      this.logger.error('Failed to save migration:', error);
      throw error;
    }
  }

  async migrationExists(id: string): Promise<boolean> {
    try {
      return this.data.migrations.some(migration => migration.id === id);
    } catch (error) {
      this.logger.error('Failed to check migration existence:', error);
      return false;
    }
  }

  async migrationExistsByDetails(token: MigratedToken): Promise<boolean> {
    try {
      // Primary check: Contract address (most reliable)
      if (token.contractAddress) {
        const existsByContract = this.data.migrations.some(migration => 
          migration.contractAddress && 
          migration.contractAddress.toLowerCase() === token.contractAddress.toLowerCase()
        );
        
        if (existsByContract) {
          this.logger.debug(`Token already exists by contract address: ${token.symbol} (${token.contractAddress})`);
          return true;
        }
      }

      // Secondary check: Same symbol AND name (for tokens without contract address)
      const existsBySymbolName = this.data.migrations.some(migration => 
        migration.symbol.toLowerCase() === token.symbol.toLowerCase() &&
        migration.name.toLowerCase() === token.name.toLowerCase()
      );

      if (existsBySymbolName) {
        this.logger.debug(`Token already exists by name/symbol: ${token.name} (${token.symbol})`);
        return true;
      }

      // Tertiary check: Same ID
      const existsById = this.data.migrations.some(migration => 
        migration.id === token.id
      );

      if (existsById) {
        this.logger.debug(`Token already exists by ID: ${token.symbol} (${token.id})`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check migration existence by details:', error);
      return false;
    }
  }

  async getStats(): Promise<{ totalMigrations: number; migrationsToday: number; migrationsThisWeek: number }> {
    try {
      const total = this.data.migrations.length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const migrationsToday = this.data.migrations.filter(migration => {
        const migrationDate = new Date(migration.migrationDate);
        migrationDate.setHours(0, 0, 0, 0);
        return migrationDate.getTime() >= today.getTime();
      }).length;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      const migrationsThisWeek = this.data.migrations.filter(migration => {
        const migrationDate = new Date(migration.migrationDate);
        return migrationDate.getTime() >= weekAgo.getTime();
      }).length;

      return {
        totalMigrations: total,
        migrationsToday: migrationsToday,
        migrationsThisWeek: migrationsThisWeek
      };
    } catch (error) {
      this.logger.error('Failed to get stats:', error);
      return { totalMigrations: 0, migrationsToday: 0, migrationsThisWeek: 0 };
    }
  }

  async getRecentMigrations(limit: number = 10): Promise<MigratedToken[]> {
    try {
      return this.data.migrations.slice(0, limit).map(migration => ({
        ...migration,
        migrationDate: new Date(migration.migrationDate)
      }));
    } catch (error) {
      this.logger.error('Failed to get recent migrations:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    try {
      await this.saveData();
      this.logger.info('Database connection closed');
    } catch (error) {
      this.logger.error('Error closing database:', error);
    }
  }

  async clearDatabase(): Promise<void> {
    try {
      this.data = {
        migrations: [],
        lastUpdated: new Date().toISOString()
      };
      await this.saveData();
      this.logger.info('Database cleared successfully');
    } catch (error) {
      this.logger.error('Error clearing database:', error);
      throw error;
    }
  }
}
