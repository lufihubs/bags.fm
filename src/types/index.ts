export interface MigratedToken {
  id: string;
  name: string;
  symbol: string;
  contractAddress: string;
  migrationDate: Date; // This will represent the launch/bonding date
  fromChain?: string;
  toChain?: string;
  marketCap?: number;
  price?: number;
  volume24h?: number;
  url?: string;
  // Additional fields for bags.fm tokens
  description?: string;
  image?: string;
  creator?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  bondingProgress?: number;
  bondingCompleted?: boolean;
  // New fields for bonding analytics
  bondingDuration?: number; // Duration in hours
  totalRaised?: number; // Total amount raised during bonding
  createdAt?: Date; // When token was created (for duration calculation)
}

export interface BotConfig {
  telegramBotToken: string;
  telegramChatId: string;
  checkIntervalMinutes: number;
  databasePath: string;
  bagsFmUrl: string;
  logLevel: string;
}
