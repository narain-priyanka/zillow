import express, { Request, Response } from 'express';
import puppeteer from "puppeteer";
import { scrapedHomeListing } from "./scraper";

const app = express();
const PORT = process.env.PORT || 8080;

app.get("/scrape", async (req: Request, res: Response): Promise<void> => {
    console.log("Received request at /scrape");
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        const homeListings = await scrapedHomeListing(page);
        res.json(homeListings);
    } catch (error) {
        console.error("Error in /scrape:", error);
        res.status(500).json({ error: "Scraping failed", details: (error as Error).message });
    } finally {
        if (browser) {
            await browser.close();
            console.log("Browser closed");
        }
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

export { app };
