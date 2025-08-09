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
}

interface LeaderboardResponse {
  tokens: BagsApiToken[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export class BagsFmScraper {
  private baseUrl: string;
  private logger: Logger;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.logger = new Logger();
  }

  async fetchMigrations(): Promise<MigratedToken[]> {
    try {
      this.logger.debug(`Fetching migrated tokens from ${this.baseUrl}`);
      
      // Fetch from the leaderboard API endpoint
      const response = await axios.get(`${this.baseUrl}/api/v1/token-launch/leaderboard`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://bags.fm/'
        },
        timeout: 10000
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return this.parseTokenLaunches(response.data);
    } catch (error) {
      this.logger.error('Error fetching migrated tokens:', error);
      return [];
    }
  }

  private parseTokenLaunches(data: any): MigratedToken[] {
    const tokens: MigratedToken[] = [];

    try {
      // Handle different possible response structures
      let tokenList: BagsApiToken[] = [];
      
      // Handle bags.fm API response format
      if (data.success && Array.isArray(data.response)) {
        tokenList = data.response;
      } else if (Array.isArray(data)) {
        tokenList = data;
      } else if (data.tokens && Array.isArray(data.tokens)) {
        tokenList = data.tokens;
      } else if (data.data && Array.isArray(data.data)) {
        tokenList = data.data;
      } else {
        this.logger.warn('Unexpected API response structure:', JSON.stringify(data, null, 2));
        return tokens;
      }

      this.logger.debug(`Processing ${tokenList.length} tokens from API`);
      
      // Log the first token to see what data we're getting
      if (tokenList.length > 0) {
        this.logger.debug('Sample token data from API:', JSON.stringify(tokenList[0], null, 2));
      }

      for (const token of tokenList) {
        try {
          // Calculate market cap if not provided (price * total supply estimate)
          let marketCap = token.marketCap;
          if (!marketCap && token.price) {
            // Most meme tokens have 1B supply, this is an estimate
            marketCap = token.price * 1000000000;
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
            id: token.tokenAddress || `token-${Date.now()}-${Math.random()}`,
            name: token.name || 'Unknown Token',
            symbol: token.symbol || 'UNKNOWN',
            contractAddress: token.tokenAddress,
            migrationDate: migrationDate,
            createdAt: createdDate,
            fromChain: 'Solana',
            toChain: 'Bags.fm Launch',
            marketCap: marketCap,
            price: token.price,
            volume24h: token.volume24h,
            totalRaised: totalRaised,
            bondingDuration: bondingDuration,
            url: `https://bags.fm/token/${token.tokenAddress}`,
            image: token.image
          };

          // Log token details for debugging
          this.logger.debug(`Processed token ${token.symbol}:`, {
            marketCap: marketCap,
            price: token.price,
            volume24h: token.volume24h,
            totalRaised: totalRaised,
            bondingDuration: bondingDuration,
            hasImage: !!token.image
          });

          tokens.push(migration);
        } catch (error) {
          this.logger.warn('Error parsing token:', error, token);
        }
      }

      this.logger.debug(`Parsed ${tokens.length} token launches`);
      return tokens;
    } catch (error) {
      this.logger.error('Error parsing token launches:', error);
      return tokens;
    }
  }

  // Get specific token details
  async getTokenDetails(tokenAddress: string): Promise<BagsApiToken | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/bags/token/find?tokenAddress=${tokenAddress}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://bags.fm/'
        },
        timeout: 10000
      });

      if (response.status === 200 && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to get token details for ${tokenAddress}:`, error);
      return null;
    }
  }

  // Alternative method to fetch recent launches with pagination
  async fetchRecentLaunches(page: number = 1, limit: number = 20): Promise<MigratedToken[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/token-launch/leaderboard`, {
        params: {
          page,
          limit,
          sortBy: 'createdAt',
          order: 'desc'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://bags.fm/'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        return this.parseTokenLaunches(response.data);
      }

      return [];
    } catch (error) {
      this.logger.error('Error fetching recent launches:', error);
      return [];
    }
  }
}
