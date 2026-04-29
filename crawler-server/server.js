import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";

const app = express();
app.use(cors());

function makeSummary(items) {
  const prices = items.map((item) => item.price).filter((v) => v > 0);

  if (!prices.length) {
    return { minPrice: 0, maxPrice: 0, avgPrice: 0 };
  }

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
  };
}

app.get("/api/price", async (req, res) => {
  const keyword = req.query.keyword || "복숭아";
  let browser;

  try {
            browser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium",
        headless: "new",
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );

    await page.goto(
      `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`,
      { waitUntil: "networkidle2", timeout: 30000 }
    );

    await page.waitForTimeout(2000);

    const items = await page.evaluate(() => {
      const results = [];

      const candidates = Array.from(
        document.querySelectorAll("a, div, span")
      );

      const productBlocks = Array.from(
        document.querySelectorAll("[class*='product'], [class*='Product']")
      );

      productBlocks.forEach((el) => {
        const text = el.innerText || "";
        const priceMatch = text.match(/[0-9,]+원/);

        const link = el.querySelector("a")?.href || "";
        const title =
          el.querySelector("a")?.innerText?.trim() ||
          text.split("\n").find((line) => line.length > 5)?.trim() ||
          "";

        if (title && priceMatch) {
          const price = Number(priceMatch[0].replace(/[^0-9]/g, ""));

          if (price > 0) {
            results.push({
              title,
              price,
              link,
            });
          }
        }
      });

      return results.slice(0, 20);
    });

    res.json({
      ok: true,
      keyword,
      items,
      summary: makeSummary(items),
    });
  } catch (e) {
    res.json({
      ok: false,
      keyword,
      error: e.message,
      items: [],
      summary: makeSummary([]),
    });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Crawler server running on ${PORT}`);
});