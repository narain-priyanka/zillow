import { Page } from "puppeteer";
const puppeteer = require("puppeteer");

const randomSleep = (min: number, max: number) =>
  new Promise((r) => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

interface Home {
  price: string;
  address: string;
  link: string;
}

export async function scrapedHomeListing(page: Page) {
  const baseUrl = "https://www.zillow.com/new-york-ny/";
  const listings: Home[] = [];

  for (let pageNum = 1; pageNum <= 30; pageNum++) {
    const pageUrl = pageNum === 1 ? baseUrl : `${baseUrl}${pageNum}_p/`;
    console.log(`Navigating to: ${pageUrl}`);

    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1280, height: 800 });

    try {
      await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 45000 }); // Increased timeout
    } catch (error) {
      console.warn(`Failed to load page ${pageNum}, retrying...`);
      continue; 
    }

    await randomSleep(2000, 5000);

    let attempts = 0;
    while (attempts < 3) {
      try {
        await page.waitForSelector("#grid-search-results", { timeout: 30000 });
        break;
      } catch (error) {
        console.warn(`Retrying... (${attempts + 1}/3)`);
        await randomSleep(3000, 5000);
        attempts++;
      }
    }

    const homes: Home[] = await page.evaluate(() => {
      const homeElements = document.querySelectorAll("article[data-test='property-card']");
      return Array.from(homeElements).map((home) => ({
        price: home.querySelector("span[data-test='property-card-price']")?.textContent?.trim() || "N/A",
        address: home.querySelector("address[data-test='property-card-addr']")?.textContent?.trim() || "N/A",
        link: home.querySelector("a")?.href || "N/A",
      }));
    });

    if (homes.length === 0) {
      console.warn(`No listings found on Page ${pageNum}. Skipping...`);
      continue;
    }
    homes.forEach((home, index) => {
        console.log(`Page ${pageNum} - Listing ${index + 1}:`);
        console.log(`Address: ${home.address}`);
        console.log(`Price: ${home.price}`);
        console.log(`Link: ${home.link}`);
        console.log("---------------------------------------------------");
    });
    listings.push(...homes);
    console.log(`Page ${pageNum}: Extracted ${homes.length} listings`);
    await randomSleep(3000, 7000);
  }
  console.log(listings);
  return { listings };
}

