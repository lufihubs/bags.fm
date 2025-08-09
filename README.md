# Bags.fm Migration Bot

A Telegram bot that monitors bags.fm for new token migrations and automatically sends notifications to your Telegram channel.

## Features

- 🔍 **Automatic Monitoring**: Checks bags.fm regularly for new token migrations
- 📱 **Telegram Integration**: Sends formatted notifications to your Telegram channel
- 💾 **Data Persistence**: Tracks migrations to avoid duplicate notifications
- 📊 **Statistics**: View migration statistics with bot commands
- ⚙️ **Configurable**: Customizable check intervals and settings

## Setup

### 1. Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Telegram Bot Token (from @BotFather)
- A Telegram Chat/Channel ID

### 2. Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file:
   ```bash
   copy .env.example .env
   ```

4. Edit `.env` file with your configuration:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TELEGRAM_CHAT_ID=your_telegram_chat_id_here
   CHECK_INTERVAL_MINUTES=5
   DATABASE_PATH=./data/migrations.json
   BAGS_FM_URL=https://bags.fm
   LOG_LEVEL=info
   ```

### 3. Getting Telegram Credentials

#### Bot Token:
1. Message @BotFather on Telegram
2. Use `/newbot` command
3. Follow the prompts to create your bot
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
