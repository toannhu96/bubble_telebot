import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface TokenInfo {
  name: string;
  symbol: string;
  price: number;
  price_change_24h_percentage: number;
  market_cap: number;
  volume_24h: number;
  circulating_supply?: number;
  total_supply?: number;
}

export class TokenService {
  private readonly CMC_API_KEY = process.env.CMC_API_KEY;
  private readonly CMC_BASE_URL = "https://pro-api.coinmarketcap.com/v2";

  /**
   * Fetches token information from CoinMarketCap
   * @param tokenAddress The token contract address
   * @param chain The blockchain network
   * @returns Token market data
   */
  async getTokenInfo(
    tokenAddress: string,
    chain: string
  ): Promise<TokenInfo | null> {
    try {
      // Convert chain to CoinMarketCap platform format
      const platform = this.mapChainToPlatform(chain);

      if (!platform) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      // Call cryptocurrency/info endpoint to get CMC ID
      const infoResponse = await axios.get(
        `${this.CMC_BASE_URL}/cryptocurrency/info`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": this.CMC_API_KEY,
            Accept: "application/json",
          },
          params: {
            address: tokenAddress,
          },
        }
      );

      // Extract CMC ID from the response
      const tokenData = Object.values(infoResponse.data.data)[0] as any;
      const cmcId = tokenData.id;

      if (!cmcId) {
        throw new Error("Could not find token on CoinMarketCap");
      }

      // Get quotes for the token using the CMC ID
      const quotesResponse = await axios.get(
        `${this.CMC_BASE_URL}/cryptocurrency/quotes/latest`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": this.CMC_API_KEY,
            Accept: "application/json",
          },
          params: {
            id: cmcId,
            convert: "USD",
          },
        }
      );

      const quoteData = quotesResponse.data.data[cmcId];
      const quote = quoteData.quote.USD;

      return {
        name: quoteData.name,
        symbol: quoteData.symbol,
        price: quote.price,
        price_change_24h_percentage: quote.percent_change_24h,
        market_cap: quote.market_cap,
        volume_24h: quote.volume_24h,
        circulating_supply: quoteData.circulating_supply,
        total_supply: quoteData.total_supply,
      };
    } catch (error) {
      console.error("Error fetching token info:", error);
      return null;
    }
  }

  /**
   * Formats detailed token data for Telegram display
   * @param tokenAddress The token contract address
   * @param chain The blockchain network
   * @returns Formatted message for Telegram
   */
  async formatTokenInfoForTelegram(
    tokenAddress: string,
    chain: string
  ): Promise<string> {
    try {
      // Convert chain to CoinMarketCap platform format
      const platform = this.mapChainToPlatform(chain);

      if (!platform) {
        throw new Error(`Unsupported chain: ${chain}`);
      }

      // Call cryptocurrency/info endpoint to get token details
      const infoResponse = await axios.get(
        `${this.CMC_BASE_URL}/cryptocurrency/info`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": this.CMC_API_KEY,
            Accept: "application/json",
          },
          params: {
            address: tokenAddress,
          },
        }
      );

      // Extract token data
      const tokenData = Object.values(infoResponse.data.data)[0] as any;
      const cmcId = tokenData.id;

      if (!cmcId) {
        throw new Error("Could not find token on CoinMarketCap");
      }

      // Get quotes for the token using the CMC ID
      const quotesResponse = await axios.get(
        `${this.CMC_BASE_URL}/cryptocurrency/quotes/latest`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": this.CMC_API_KEY,
            Accept: "application/json",
          },
          params: {
            id: cmcId,
            convert: "USD",
          },
        }
      );

      const quoteData = quotesResponse.data.data[cmcId];
      const quote = quoteData.quote.USD;

      // Format the message for Telegram
      const priceChangeEmoji = quote.percent_change_24h >= 0 ? "🟢" : "🔴";
      const priceChangeText =
        quote.percent_change_24h >= 0
          ? `+${quote.percent_change_24h.toFixed(2)}%`
          : `${quote.percent_change_24h.toFixed(2)}%`;

      // Create links sections
      const websiteLink =
        tokenData.urls.website && tokenData.urls.website[0]
          ? `[Website](${tokenData.urls.website[0]})`
          : "";
      const explorerLink =
        tokenData.urls.explorer && tokenData.urls.explorer[0]
          ? `[Explorer](${tokenData.urls.explorer[0]})`
          : "";
      const twitterLink =
        tokenData.urls.twitter && tokenData.urls.twitter[0]
          ? `[Twitter](${tokenData.urls.twitter[0]})`
          : "";

      const links = [websiteLink, explorerLink, twitterLink]
        .filter((link) => link !== "")
        .join(" | ");

      // Format circulating supply
      const circulatingSupply = quoteData.circulating_supply
        ? `${Math.floor(quoteData.circulating_supply).toLocaleString()} ${
            tokenData.symbol
          }`
        : "N/A";

      // Main message content - using simple string instead of template literals for better compatibility
      return (
        "*" +
        tokenData.name +
        " (" +
        tokenData.symbol +
        ")*\n\n" +
        "💰 *Price*: $" +
        (quote.price < 0.01 ? quote.price.toFixed(8) : quote.price.toFixed(2)) +
        " " +
        priceChangeEmoji +
        " " +
        priceChangeText +
        "\n" +
        "📊 *Market Cap*: " +
        this.formatCurrency(quote.market_cap) +
        "\n" +
        "📈 *24h Volume*: " +
        this.formatCurrency(quote.volume_24h) +
        "\n" +
        "🏦 *Circulating Supply*: " +
        circulatingSupply +
        "\n\n" +
        (tokenData.description
          ? tokenData.description.substring(0, 200) +
            (tokenData.description.length > 200 ? "..." : "") +
            "\n\n"
          : "") +
        (links ? "*Links*: " + links : "")
      );
    } catch (error) {
      console.error("Error formatting token info for Telegram:", error);
      return "Sorry, could not retrieve token information.";
    }
  }

  /**
   * Maps blockchain short names to CoinMarketCap platform slugs
   * @param chain The blockchain short name
   * @returns The CoinMarketCap platform name
   */
  private mapChainToPlatform(chain: string): string | null {
    const platformMap: Record<string, string> = {
      eth: "ethereum",
      bsc: "binance-smart-chain",
      ftm: "fantom",
      avax: "avalanche",
      cro: "cronos",
      arbi: "arbitrum-one",
      poly: "polygon-pos",
      base: "base",
      sol: "solana",
      sonic: "sonic",
    };

    return platformMap[chain.toLowerCase()] || null;
  }

  /**
   * Formats a number as currency
   * @param num The number to format
   * @returns Formatted currency string
   */
  formatCurrency(num: number): string {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`;
    } else {
      return `$${num.toFixed(2)}`;
    }
  }
}
