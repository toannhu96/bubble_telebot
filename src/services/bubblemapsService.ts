import axios from "axios";
import puppeteer from "puppeteer";
import { BubblemapsResponse } from "../types/bubblemaps";

export class BubblemapsService {
  private readonly API_BASE_URL = "https://api-legacy.bubblemaps.io";

  /**
   * Fetches map data for a specific token on a blockchain
   * @param tokenAddress The contract address of the token
   * @param chain The blockchain network (eth, bsc, ftm, avax, cro, arbi, poly, base, sol, sonic)
   * @returns The BubbleMaps data for the token
   */
  async getMapData(
    tokenAddress: string,
    chain: string
  ): Promise<BubblemapsResponse> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/map-data`, {
        params: {
          token: tokenAddress,
          chain,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new Error("Token not computed yet or API key required");
      }
      throw error;
    }
  }

  /**
   * Calculates a decentralization score based on token distribution
   * @param mapData The BubbleMaps API response
   * @returns A score between 0-100 where higher is more decentralized
   */
  calculateDecentralizationScore(mapData: BubblemapsResponse): number {
    // Get top 10 holders
    const top10Holders = mapData.nodes.slice(0, 10);

    // Calculate the percentage held by top 10 holders
    const top10Percentage = top10Holders.reduce(
      (sum, holder) => sum + holder.percentage,
      0
    );

    // Calculate score - higher concentration equals lower score
    // 100 - concentration gives us a decentralization score
    const score = Math.max(0, Math.min(100, 100 - top10Percentage / 100));

    return Math.round(score * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Takes a screenshot of a bubble map
   * @param tokenAddress The contract address of the token
   * @param chain The blockchain network
   * @returns A buffer containing the screenshot
   */
  async generateBubblemapScreenshot(
    tokenAddress: string,
    chain: string
  ): Promise<Buffer> {
    return this.capturePageScreenshot(tokenAddress, chain);
  }

  /**
   * Takes a screenshot of the bubble map page
   */
  private async capturePageScreenshot(
    tokenAddress: string,
    chain: string
  ): Promise<Buffer> {
    const url = `https://app.bubblemaps.io/${chain}/token/${tokenAddress}`;

    console.log(`Taking screenshot of Bubblemaps page...`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--window-size=1920,1080",
      ],
    });

    try {
      const page = await browser.newPage();

      // Set viewport to a larger size for better screenshot
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });

      // Set user agent
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Try each URL until one works
      try {
        console.log(`Navigating to ${url}...`);

        // Navigate to the page
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        // Wait for the page to fully render
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check if the page contains map elements
        const hasMap = await page.evaluate(() => {
          return (
            document.querySelector(".map-container") !== null ||
            document.querySelector("#bubblemapViewer") !== null ||
            document.querySelector(".bubblemap-container") !== null ||
            document.querySelector("svg") !== null
          );
        });

        if (hasMap) {
          console.log("Map found on page, taking screenshot...");
        } else {
          console.log("No map found on this URL, trying next...");
        }
      } catch (urlError) {
        console.error(`Error loading URL ${url}:`, urlError);
        // Continue to next URL
      }

      // Take the screenshot of the full page
      const screenshot = await page.screenshot({
        type: "png",
        fullPage: true,
      });

      console.log("Screenshot captured successfully");
      return screenshot as Buffer;
    } catch (error) {
      console.error("Error capturing screenshot:", error);

      // As a last resort, try to take a screenshot of whatever is loaded
      try {
        console.log("Taking fallback screenshot...");
        const screenshot = await (
          await browser.pages()
        )[0].screenshot({
          type: "png",
        });
        return screenshot as Buffer;
      } catch (fallbackError) {
        console.error("Even fallback screenshot failed:", fallbackError);
        throw error; // Throw the original error
      }
    } finally {
      await browser.close();
      console.log("Browser closed");
    }
  }
}
