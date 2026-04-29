import { load } from "cheerio";

function toNumber(value) {
  return Number(String(value || "").replace(/[^0-9]/g, "")) || 0;
}

async function fetchHtml(keyword) {
  const url = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(
    keyword
  )}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`크롤링 실패 ${res.status}`);
  }

  return res.text();
}

function parseItems(html) {
  const $ = load(html);
  const items = [];

  $("div.product_item__MDtDF").each((i, el) => {
    const title = $(el).find("a.product_link__TrAac").text().trim();
    const priceText = $(el)
      .find("span.price_num__S2p_v")
      .first()
      .text();

    const price = toNumber(priceText);

    if (title && price) {
      items.push({
        title,
        price,
      });
    }
  });

  return items;
}

function makeSummary(items) {
  const prices = items.map((i) => i.price);

  if (!prices.length) {
    return { minPrice: 0, maxPrice: 0, avgPrice: 0 };
  }

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgPrice: Math.round(
      prices.reduce((a, b) => a + b, 0) / prices.length
    ),
  };
}

export async function handler(event) {
  const keyword = event.queryStringParameters?.keyword || "복숭아";

  let items = [];
  let errorMessage = null;

  try {
    const html = await fetchHtml(keyword);
    items = parseItems(html);
  } catch (e) {
    errorMessage = e.message;
  }

return {
  statusCode: 200,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    ok: !errorMessage,
    keyword,
    errorMessage,
    items,
    summary: makeSummary(items),
  }),
};
}