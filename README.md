# Bags.fm Token Migration Bot

A production-ready Telegram bot that monitors bags.fm for token migrations above $100k market cap.

## 🚀 Deployment Options

### Option 1: Railway (Recommended - Free Tier Available)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
   railway login
   railway link
   railway up
   ```

3. **Set Environment Variables:**
   ```bash
   railway variables set TELEGRAM_BOT_TOKEN=7733553298:AAFLTcY8UvGdMIW3JnIIYYmtoCSEhOkUEG8
   railway variables set TELEGRAM_CHAT_ID=-1002789011652
   railway variables set BAGS_FM_API_URL=https://api2.bags.fm
   railway variables set CHECK_INTERVAL_MINUTES=1
   railway variables set MARKET_CAP_THRESHOLD=100000
   ```

### Option 2: Render (Free Tier)

1. **Connect GitHub Repository:**
   - Push code to GitHub
   - Connect to Render
   - Set build command: `npm run build`
   - Set start command: `npm start`

2. **Environment Variables (in Render dashboard):**
   ```
   TELEGRAM_BOT_TOKEN=7733553298:AAFLTcY8UvGdMIW3JnIIYYmtoCSEhOkUEG8
   TELEGRAM_CHAT_ID=-1002789011652
   BAGS_FM_API_URL=https://api2.bags.fm
   CHECK_INTERVAL_MINUTES=1
   MARKET_CAP_THRESHOLD=100000
   ```

### Option 3: DigitalOcean App Platform

1. **Create New App:**
   - Connect GitHub repository
   - Configure as Web Service
   - Set build command: `npm run build`
   - Set run command: `npm start`

### Option 4: Docker Deployment (VPS)

1. **Build and Run:**
   ```bash
   docker-compose up -d
   ```

2. **Or build manually:**
   ```bash
   docker build -t bags-fm-bot .
   docker run -d --name bags-fm-bot --env-file .env bags-fm-bot
   ```
4. Copy the provided token

#### Chat ID:
1. Add your bot to the channel/group
2. Send a message to the channel
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `chat.id` in the response

### 4. Running the Bot

#### Development:
```bash
npm run dev
```

#### Production:
```bash
npm run build
npm start
```

## Bot Commands

- `/start` - Initialize the bot and show welcome message
- `/status` - Check if the bot is running
- `/check` - Manually trigger a migration check
- `/stats` - View migration statistics

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | Required |
| `TELEGRAM_CHAT_ID` | Target chat/channel ID | Required |
| `CHECK_INTERVAL_MINUTES` | How often to check for migrations | 5 |
| `DATABASE_PATH` | Path to store migration data | `./data/migrations.json` |
| `BAGS_FM_URL` | Base URL for bags.fm | `https://bags.fm` |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` |

## Project Structure

```
src/
├── index.ts              # Main entry point
├── bot/
│   └── BagsFmBot.ts      # Main bot class
├── scraper/
│   └── BagsFmScraper.ts  # Web scraping logic
├── database/
│   └── DatabaseManager.ts # Data persistence
├── types/
│   └── index.ts          # TypeScript types
└── utils/
    └── Logger.ts         # Logging utility
```

## How It Works

1. **Monitoring**: The bot periodically checks bags.fm for new migrations
2. **Detection**: Compares current migrations with stored data to find new ones
3. **Notification**: Sends formatted messages to your Telegram channel
4. **Storage**: Saves migration data to prevent duplicate notifications

## Troubleshooting

### Common Issues

1. **Bot not responding**: Check if the bot token is correct
2. **No notifications**: Verify the chat ID and bot permissions
3. **Build errors**: Ensure all dependencies are installed correctly

### Logs

The bot provides detailed logging. Check the console output for debugging information.

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Disclaimer

This bot is for educational purposes. Always respect the terms of service of the websites you're monitoring.
