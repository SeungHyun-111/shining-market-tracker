import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());

app.get("/api/price", async (req, res) => {
  const keyword = req.query.keyword || "복숭아";

  let browser;

  try {
    browser = await chromium.launch({
      args: ["--no-sandbox"],
      executablePath: "/opt/render/.cache/ms-playwright/chromium/chrome-linux/chrome", // 🔥 핵심
    });

    const page = await browser.newPage();

    await page.goto(
      `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keyword)}`,
      { waitUntil: "domcontentloaded" }
    );

    await page.waitForTimeout(2000);

    const items = await page.evaluate(() => {
      const results = [];
      const nodes = document.querySelectorAll("div.product_item__MDtDF");

      nodes.forEach((el) => {
        const title =
          el.querySelector("a.product_link__TrAac")?.innerText || "";

        const priceText =
          el.querySelector("span.price_num__S2p_v")?.innerText || "";

        const price = Number(priceText.replace(/[^0-9]/g, ""));

        if (title && price) {
          results.push({ title, price });
        }
      });

      return results.slice(0, 20);
    });

    const prices = items.map((i) => i.price);

    const summary = {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: Math.round(
        prices.reduce((a, b) => a + b, 0) / prices.length
      ),
    };

    res.json({
      ok: true,
      keyword,
      items,
      summary,
    });
  } catch (e) {
    res.json({
      ok: false,
      error: e.message,
    });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Crawler server running on ${PORT}`);
});