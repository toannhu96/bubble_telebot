import { Bot, InlineKeyboard, Context, session, SessionFlavor } from "grammy";
import { InputFile } from "grammy";
import dotenv from "dotenv";
import { BubblemapsService } from "./services/bubblemapsService";
import { TokenService } from "./services/tokenService";
import { BubblemapsResponse } from "./types/bubblemaps";
import { PublicKey } from "@solana/web3.js";
import { BotCommand } from "grammy/types";

dotenv.config();

// Check if bot token is provided
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set in .env file");
  process.exit(1);
}

console.log("Bot starting...");

// Initialize services
const bubblemapsService = new BubblemapsService();
const tokenService = new TokenService();

// Define session interface
interface SessionData {
  currentChain: string;
  awaitingAddress: boolean;
}

// Augment context with session data
type MyContext = Context & SessionFlavor<SessionData>;

// Create bot instance
const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_TOKEN);

// Initialize session middleware
bot.use(
  session({
    initial: (): SessionData => ({
      currentChain: "eth", // Default chain is Ethereum
      awaitingAddress: false,
    }),
  })
);

// Valid chains
const VALID_CHAINS = [
  "eth",
  "bsc",
  "ftm",
  "avax",
  "cro",
  "arbi",
  "poly",
  "base",
  "sol",
  "sonic",
];

// Helper function to create main menu
function createMainMenu(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔍 Search Token", "search_token")
    .text("⛓️ Change Chain", "change_chain")
    .row()
    .text("ℹ️ Help", "show_help")
    .text("📊 My Current Chain", "show_chain");
}

// Helper function to create chain selection menu
function createChainMenu(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  // Add chains in a 2x5 grid
  for (let i = 0; i < VALID_CHAINS.length; i += 2) {
    const btn1 = VALID_CHAINS[i].toUpperCase();
    const btn2 =
      i + 1 < VALID_CHAINS.length ? VALID_CHAINS[i + 1].toUpperCase() : null;

    if (btn2) {
      keyboard
        .text(btn1, `set_chain:${VALID_CHAINS[i]}`)
        .text(btn2, `set_chain:${VALID_CHAINS[i + 1]}`)
        .row();
    } else {
      keyboard.text(btn1, `set_chain:${VALID_CHAINS[i]}`).row();
    }
  }

  // Add back button
  keyboard.text("🔙 Back to Main Menu", "main_menu");

  return keyboard;
}

// Handle start command
bot.command("start", async (ctx) => {
  await ctx.reply(
    "Welcome to Bubblemaps Telegram Bot! 🎯\n\n" +
      "I can show you bubble maps for any token contract address.\n\n" +
      "Use the menu below to get started:",
    {
      reply_markup: createMainMenu(),
    }
  );
});

// Handle help command
bot.command("help", async (ctx) => {
  await ctx.reply(
    "Available commands:\n\n" +
      "/start - Start the bot and show main menu\n" +
      "/help - Show this help message\n" +
      "/menu - Show main menu\n" +
      "/setchain [chain] - Set blockchain (eth, bsc, ftm, avax, cro, arbi, poly, base, sol, sonic)\n\n" +
      "Or simply send me a contract address and I'll analyze it for you!",
    {
      reply_markup: createMainMenu(),
    }
  );
});

// Add menu command
bot.command("menu", async (ctx) => {
  await ctx.reply("Please select an option:", {
    reply_markup: createMainMenu(),
  });
});

// Handle setchain command (keeping for backward compatibility)
bot.command("setchain", async (ctx) => {
  const chain = ctx.message?.text.split(" ")[1]?.toLowerCase();

  if (!chain || !VALID_CHAINS.includes(chain)) {
    await ctx.reply("Please specify a valid chain:", {
      reply_markup: createChainMenu(),
    });
    return;
  }

  ctx.session.currentChain = chain;
  await ctx.reply(`Chain set to ${chain.toUpperCase()}`, {
    reply_markup: createMainMenu(),
  });
});

// Handle callback queries
bot.on("callback_query:data", async (ctx) => {
  const callbackData = ctx.callbackQuery.data;

  // Handle main menu options
  if (callbackData === "search_token") {
    ctx.session.awaitingAddress = true;
    await ctx.answerCallbackQuery("Please send a contract address");
    await ctx.reply(
      `Please send a contract address for ${ctx.session.currentChain.toUpperCase()}:`
    );
    return;
  }

  if (callbackData === "change_chain") {
    await ctx.answerCallbackQuery("Select a chain");
    await ctx.reply("Select blockchain:", {
      reply_markup: createChainMenu(),
    });
    return;
  }

  if (callbackData === "show_help") {
    await ctx.answerCallbackQuery("Showing help");
    await ctx.reply(
      "Available options:\n\n" +
        "🔍 Search Token - Analyze a token contract\n" +
        "⛓️ Change Chain - Switch to a different blockchain\n" +
        "ℹ️ Help - Show this help message\n" +
        "📊 My Current Chain - Show currently selected blockchain\n\n" +
        "You can also simply send a contract address at any time to analyze it."
    );
    return;
  }

  if (callbackData === "show_chain") {
    await ctx.answerCallbackQuery(
      `Current chain: ${ctx.session.currentChain.toUpperCase()}`
    );
    await ctx.reply(
      `Your currently selected blockchain is: ${ctx.session.currentChain.toUpperCase()}`
    );
    return;
  }

  if (callbackData === "main_menu") {
    await ctx.answerCallbackQuery("Showing main menu");
    await ctx.reply("Main menu:", {
      reply_markup: createMainMenu(),
    });
    return;
  }

  // Handle chain selection
  if (callbackData.startsWith("set_chain:")) {
    const selectedChain = callbackData.split(":")[1];
    if (VALID_CHAINS.includes(selectedChain)) {
      ctx.session.currentChain = selectedChain;
      await ctx.answerCallbackQuery(
        `Chain set to ${selectedChain.toUpperCase()}`
      );
      await ctx.reply(`Blockchain set to ${selectedChain.toUpperCase()}`, {
        reply_markup: createMainMenu(),
      });
    }
    return;
  }

  // Default fallback for unknown callbacks
  await ctx.answerCallbackQuery("Unknown option");
});

// Handle contract addresses
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();

  // If it's a command, don't process as an address
  if (text.startsWith("/")) {
    return;
  }

  // Get current chain from session
  const chain = ctx.session.currentChain;

  // Validate address based on chain
  let isValidAddress = false;

  if (chain === "sol") {
    try {
      new PublicKey(text);
      isValidAddress = true;
    } catch (error) {
      if (ctx.session.awaitingAddress) {
        await ctx.reply("Please send a valid Solana contract address", {
          reply_markup: createMainMenu(),
        });
        ctx.session.awaitingAddress = false;
      }
      return;
    }
  } else {
    // Basic validation for Ethereum-style address
    if (/^0x[a-fA-F0-9]{40}$/.test(text)) {
      isValidAddress = true;
    } else if (ctx.session.awaitingAddress) {
      await ctx.reply(
        "Please send a valid contract address (0x... format) for EVM chains",
        {
          reply_markup: createMainMenu(),
        }
      );
      ctx.session.awaitingAddress = false;
      return;
    } else {
      return; // Not awaiting address and not a valid address, just ignore
    }
  }

  // Reset awaiting flag
  ctx.session.awaitingAddress = false;

  // Show processing message
  const processingMsg = await ctx.reply(
    "Processing your request. This may take a few moments..."
  );

  try {
    // Fetch token data
    await ctx.replyWithChatAction("typing");

    // Get token information
    let tokenInfo = null;
    let mapData: BubblemapsResponse | null = null;

    // Parallel requests for better performance
    const [tokenInfoResult, mapDataResult] = await Promise.allSettled([
      tokenService.formatTokenInfoForTelegram(text, chain),
      bubblemapsService.getMapData(text, chain),
    ]);

    if (tokenInfoResult.status === "fulfilled") {
      tokenInfo = tokenInfoResult.value;
    }

    if (mapDataResult.status === "fulfilled") {
      mapData = mapDataResult.value;
    } else {
      await ctx.reply(
        `Error fetching bubble map data: ${mapDataResult.reason.message}`,
        {
          reply_markup: createMainMenu(),
        }
      );
      return;
    }

    // Generate decentralization score
    const decentralizationScore =
      bubblemapsService.calculateDecentralizationScore(mapData);

    // Add holder information
    const top10Holders = mapData.nodes.slice(0, 10);
    let holdersInfo = `\n\n👥 *Top 10 Holders:*\n`;

    top10Holders.forEach((holder, index) => {
      const holderName =
        holder.name ||
        holder.address.substring(0, 6) + "..." + holder.address.substring(38);
      holdersInfo += `${index + 1}. ${holderName}: ${holder.percentage.toFixed(
        2
      )}%\n`;
    });

    // Create keyboard with token actions
    const tokenKeyboard = new InlineKeyboard()
      .url(
        "View on Bubblemaps",
        `https://app.bubblemaps.io/${chain}/token/${text}`
      )
      .row()
      .text("🔙 Back to Menu", "main_menu");

    // First send token details from CoinMarketCap
    if (tokenInfo) {
      await bot.api.sendMessage(ctx.chat.id, tokenInfo, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      } as any);
    }

    // Then send decentralization score and holders info
    let bubbleMapsInfo = `🔐 *Decentralization Score*: ${decentralizationScore}/100${holdersInfo}`;

    await bot.api.sendMessage(ctx.chat.id, bubbleMapsInfo, {
      parse_mode: "Markdown",
      reply_markup: tokenKeyboard,
      disable_web_page_preview: true,
    } as any);

    // Generate and send bubble map screenshot
    await ctx.replyWithChatAction("upload_photo");

    try {
      const screenshot = await bubblemapsService.generateBubblemapScreenshot(
        text,
        chain
      );
      await ctx.replyWithPhoto(new InputFile(screenshot), {
        caption: `🔍 Bubble Map for ${mapData.symbol} (${chain.toUpperCase()})`,
        reply_markup: createMainMenu(),
      });
    } catch (error) {
      console.error("Error generating screenshot:", error);
      await ctx.reply(
        "Could not generate bubble map screenshot. Please check the token on Bubblemaps website.",
        {
          reply_markup: createMainMenu(),
        }
      );
    }
  } catch (error) {
    console.error("Error processing token:", error);
    await ctx.reply(`Error processing token: ${(error as Error).message}`, {
      reply_markup: createMainMenu(),
    });
  } finally {
    // Delete processing message
    await bot.api
      .deleteMessage(ctx.chat.id, processingMsg.message_id)
      .catch(() => {
        // Ignore errors if message is already deleted
      });
  }
});

// Start the bot
bot
  .start()
  .then(async () => {
    console.log("Bot started successfully!");

    // Setup bot menu commands
    try {
      // Define bot commands that will appear in the menu
      const commands: BotCommand[] = [
        { command: "start", description: "Start the bot and show main menu" },
        { command: "menu", description: "Show the main menu" },
        { command: "help", description: "Show help information" },
        {
          command: "setchain",
          description: "Set blockchain network (eth, bsc, etc.)",
        },
      ];

      // Set the bot commands
      await bot.api.setMyCommands(commands);
      console.log("Bot menu commands set successfully");
    } catch (error) {
      console.error("Error setting bot menu commands:", error);
    }
  })
  .catch((err) => {
    console.error("Error starting bot:", err);
  });
