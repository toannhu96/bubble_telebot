# Bubblemaps Telegram Bot

A Telegram bot that provides token information and bubble map visualizations using the Bubblemaps API and CoinMarketCap data.

Bot: https://t.me/hak_bubble_bot

Demo: 

[![YouTube](http://i.ytimg.com/vi/6IX3_ao5giI/hqdefault.jpg)](https://www.youtube.com/watch?v=6IX3_ao5giI)

## Features

- **Token Info**: Get detailed information about any token including price, market cap, volume, and more
- **Bubble Map Visualization**: Generate and view a screenshot of the token's bubble map
- **Decentralization Score**: View a calculated score that indicates how decentralized a token is
- **Top Holders**: See the top token holders and their percentage holdings
- **Multi-Chain Support**: Works with multiple blockchains including Ethereum, BSC, Solana, and more
- **Interactive Menus**: User-friendly button menus for easy navigation
- **Blockchain Switching**: Easily switch between different blockchains with interactive buttons

## Prerequisites

- Node.js 18.x or higher
- NPM or Yarn
- A Telegram Bot Token (get from [@BotFather](https://t.me/BotFather))
- CoinMarketCap API Key (get from [CoinMarketCap](https://coinmarketcap.com/api/))

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/bubblemaps-telebot.git
   cd bubblemaps-telebot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your credentials:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   CMC_API_KEY=your_coinmarketcap_api_key_here
   ```

## Usage

### Development

Run the bot in development mode:

```
npm run dev
```

### Production

Build and run the bot in production:

```
npm run build
npm start
```

### Docker Deployment

Build and run using Docker:

```
docker build -t bubblemaps-telebot .
docker run -d --name bubblemaps-bot bubblemaps-telebot
```

### Telegram Commands

Once your bot is running, you can use the following commands in Telegram:

- `/start` - Start the bot and show main menu
- `/menu` - Show the main menu
- `/help` - Show help message
- `/setchain [chain]` - Set the blockchain (eth, bsc, ftm, avax, cro, arbi, poly, base, sol, sonic)

### Interactive Menu Options

The bot features an interactive menu system with these options:

- **🔍 Search Token** - Analyze a token by entering its contract address
- **⛓️ Change Chain** - Switch between different blockchains
- **ℹ️ Help** - Display help information
- **📊 My Current Chain** - Show which blockchain is currently selected

To analyze a token, either use the Search Token button or simply send the contract address to the bot.

## How It Works

1. The bot receives a contract address from the user
2. It fetches token data from the Bubblemaps API and CoinMarketCap
3. It calculates a decentralization score based on token distribution
4. It captures a screenshot of the token's bubble map
5. It returns all the information to the user in a well-formatted message with the bubble map image

## Technical Details

- Built with TypeScript and GrammY (Telegram Bot framework)
- Uses Puppeteer for capturing screenshots
- Integrates with Bubblemaps and CoinMarketCap APIs
- Implements a simple decentralization scoring algorithm
- Supports session management for remembering user preferences
- Features interactive inline keyboards for improved user experience
