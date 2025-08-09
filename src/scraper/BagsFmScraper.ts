import axios from 'axios';
import { Logger } from '../utils/Logger';
import { MigratedToken } from '../types';

interface BagsApiToken {
  tokenAddress: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  createdAt: string;
  migratedAt?: string;
  launchedAt?: string;
  bondingCompletedAt?: string;
  completedAt?: string;
  marketCap?: number;
  price?: number;
  volume24h?: number;
  totalRaised?: number;
  fundingGoal?: number;
  bondingCurve?: {
    completed: boolean;
    progress: number;
    completedAt?: string;
    totalRaised?: number;
  };
  creator?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  migrated?: boolean;
  launched?: boolean;
}

interface BagsApiResponse {
  success: boolean;
  response?: BagsApiToken[];
  data?: {
    leaderboard: BagsApiToken[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export class BagsFmScraper {
  private logger: Logger;
  private baseUrl = 'https://api2.bags.fm/api/v1';

  constructor() {
    this.logger = new Logger('BagsFmScraper');
  }

  async getNewMigrations(): Promise<MigratedToken[]> {
    try {
      this.logger.info('Fetching migrated tokens from bags.fm API...');
      
      const response = await axios.get<BagsApiResponse>(`${this.baseUrl}/token-launch/leaderboard`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000 // 30 seconds timeout
      });

      if (!response.data.success) {
        this.logger.warn('API returned success: false');
        this.logger.debug('API Response:', JSON.stringify(response.data, null, 2));
        return [];
      }

      // Handle both response formats
      let tokenList: BagsApiToken[] = [];
      if (response.data.response) {
        // New format: response is directly in 'response' field
        tokenList = response.data.response;
      } else if (response.data.data?.leaderboard) {
        // Old format: response is in 'data.leaderboard' field
        tokenList = response.data.data.leaderboard;
      } else {
        this.logger.warn('No token data found in API response');
        this.logger.debug('API Response:', JSON.stringify(response.data, null, 2));
        return [];
      }

      return this.parseTokenLaunches(tokenList);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Failed to fetch from bags.fm API:', error.message);
        this.logger.debug('API Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      } else {
        this.logger.error('Unexpected error:', error);
      }
      return [];
    }
  }

  private parseTokenLaunches(tokenList: BagsApiToken[]): MigratedToken[] {
    const tokens: MigratedToken[] = [];
    
    this.logger.info(`Processing ${tokenList.length} tokens from API...`);

    if (!Array.isArray(tokenList)) {
      this.logger.warn('Token list is not an array:', tokenList);
      return tokens;
    }

    for (const token of tokenList) {
      try {
        // Calculate market cap if not provided (price * total supply estimate)
        let marketCap = token.marketCap;
        if (!marketCap && token.price) {
          // Most meme tokens have 1B supply, this is an estimate
          marketCap = token.price * 1000000000;
        }

        // Check if token qualifies for notification:
        // 1. Has completed bonding/migration (traditional migration)
        // 2. OR has crossed 100k market cap threshold (new launch success)
        const hasCompletedBonding = token.bondingCurve?.completed || 
                                  token.migrated || 
                                  token.migratedAt || 
                                  token.bondingCompletedAt || 
                                  token.completedAt;
        
        const hasCrossed100kMcap = marketCap && marketCap >= 100000;
        
        // Only include tokens that meet our criteria
        if (!hasCompletedBonding && !hasCrossed100kMcap) {
          this.logger.debug(`Skipping token ${token.symbol}: Not migrated and mcap ${marketCap ? '$' + (marketCap / 1000).toFixed(0) + 'k' : 'unknown'} < $100k`);
          continue;
        }

        // Log why this token was included
        if (hasCompletedBonding) {
          this.logger.debug(`Including token ${token.symbol}: Completed bonding/migration`);
        } else if (hasCrossed100kMcap) {
          this.logger.debug(`Including token ${token.symbol}: Crossed 100k mcap threshold ($${(marketCap! / 1000).toFixed(0)}k)`);
        }

        // Use the actual bonding completion date if available, otherwise token creation date
        let migrationDate = new Date();
        let createdDate = new Date();
        let dateSource = 'current';
        
        if (token.createdAt) {
          createdDate = new Date(token.createdAt);
        }
        
        if (token.bondingCurve?.completedAt) {
          migrationDate = new Date(token.bondingCurve.completedAt);
          dateSource = 'bondingCurve.completedAt';
        } else if (token.migratedAt) {
          migrationDate = new Date(token.migratedAt);
          dateSource = 'migratedAt';
        } else if (token.launchedAt) {
          migrationDate = new Date(token.launchedAt);
          dateSource = 'launchedAt';
        } else if (token.bondingCompletedAt) {
          migrationDate = new Date(token.bondingCompletedAt);
          dateSource = 'bondingCompletedAt';
        } else if (token.completedAt) {
          migrationDate = new Date(token.completedAt);
          dateSource = 'completedAt';
        } else if (token.createdAt) {
          migrationDate = new Date(token.createdAt);
          dateSource = 'createdAt';
        }

        // Calculate bonding duration in hours
        let bondingDuration: number | undefined;
        if (createdDate && migrationDate && migrationDate > createdDate) {
          bondingDuration = (migrationDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
        }

        // Get total raised amount
        let totalRaised = token.totalRaised || token.bondingCurve?.totalRaised;

        this.logger.debug(`Token ${token.symbol}: Using ${dateSource} for migration date: ${migrationDate.toISOString()}`);
        if (bondingDuration) {
          this.logger.debug(`Token ${token.symbol}: Bonding duration: ${bondingDuration.toFixed(2)} hours`);
        }

        const migration: MigratedToken = {
          id: token.tokenAddress || `token-${token.symbol}-${token.name}`.replace(/[^a-zA-Z0-9]/g, ''),
          name: token.name || 'Unknown Token',
          symbol: token.symbol || 'UNKNOWN',
          contractAddress: token.tokenAddress,
          migrationDate: migrationDate,
          createdAt: createdDate,
          fromChain: 'Solana',
          toChain: hasCrossed100kMcap ? 'Bags.fm 100k+ Launch' : 'Bags.fm Launch',
          marketCap: marketCap,
          price: token.price,
          volume24h: token.volume24h,
          totalRaised: totalRaised,
          bondingDuration: bondingDuration,
          url: `https://bags.fm/token/${token.tokenAddress}`,
          image: token.image,
          bondingCompleted: Boolean(hasCompletedBonding)
        };

        tokens.push(migration);
      } catch (error) {
        this.logger.warn('Error parsing token:', error, token);
      }
    }

    this.logger.info(`Successfully parsed ${tokens.length} qualifying tokens`);
    return tokens;
  }
}
