function stripHtml(text = "") {
  return String(text)
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

function toNumber(value) {
  return Number(String(value || "").replace(/[^0-9]/g, "")) || 0;
}

function normalizeProduct(title = "", price = 0) {
  const cleanTitle = stripHtml(title);

  const kgMatch = cleanTitle.match(/(\d+(?:\.\d+)?)\s?kg/i);
  const gMatch = cleanTitle.match(/(\d+(?:\.\d+)?)\s?g/i);
  const countMatch = cleanTitle.match(/(\d+)\s?(개|입|팩|봉|박스|과|구|병)/);

  let weightG = null;
  let unitText = "";

  if (kgMatch) {
    weightG = Number(kgMatch[1]) * 1000;
    unitText = `${kgMatch[1]}kg`;
  } else if (gMatch) {
    weightG = Number(gMatch[1]);
    unitText = `${gMatch[1]}g`;
  }

  const count = countMatch ? Number(countMatch[1]) : null;
  const countUnit = countMatch ? countMatch[2] : "";

  const pricePerKg =
    weightG && price
      ? Math.round((price / weightG) * 1000)
      : null;

  const pricePerCount =
    count && price
      ? Math.round(price / count)
      : null;

  return {
    cleanTitle,
    weightG,
    unitText,
    count,
    countUnit,
    pricePerKg,
    pricePerCount,
  };
}

function isValidFoodItem(item) {
  const title = item.title || "";

  const blockedWords = [
    "스티커",
    "장식",
    "조형물",
    "포토존",
    "귀걸이",
    "집게핀",
    "카드",
    "쿠키런",
    "네일",
    "필러",
    "칼",
    "리본",
    "메모지",
    "파츠",
    "스티커",
  ];

  if (item.category1 !== "식품") return false;
  if (item.price < 1000) return false;
  if (blockedWords.some((word) => title.includes(word))) return false;

  return true;
}

function makeSummary(items) {
  const prices = items.map((item) => item.price).filter((price) => price > 0);

  if (!prices.length) {
    return {
      minPrice: 0,
      maxPrice: 0,
      avgPrice: 0,
      count: 0,
    };
  }

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgPrice: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    count: prices.length,
  };
}

async function fetchNaverShopping(keyword) {
  const searchKeyword = `${keyword} 생과 과일`;

  const query = new URLSearchParams({
    query: searchKeyword,
    display: "50",
    start: "1",
    sort: "sim",
    exclude: "used:rental:cbshop",
  });

  const url = `https://openapi.naver.com/v1/search/shop.json?${query.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`NAVER SHOP API 실패 ${res.status}: ${errorText}`);
  }

  return res.json();
}

function convertItems(data) {
  return (data.items || [])
    .map((item) => {
      const price = toNumber(item.lprice);
      const highPrice = toNumber(item.hprice);
      const title = stripHtml(item.title);
      const normalized = normalizeProduct(title, price);

      return {
        title,
        link: item.link,
        image: item.image,
        mall: item.mallName,
        price,
        highPrice,
        brand: item.brand || "",
        maker: item.maker || "",
        category1: item.category1 || "",
        category2: item.category2 || "",
        category3: item.category3 || "",
        category4: item.category4 || "",
        productId: item.productId,
        productType: item.productType,
        unitText: normalized.unitText,
        weightG: normalized.weightG,
        count: normalized.count,
        countUnit: normalized.countUnit,
        pricePerKg: normalized.pricePerKg,
        pricePerCount: normalized.pricePerCount,
      };
    })
    .filter(isValidFoodItem);
}

export async function handler(event) {
  const keyword = event.queryStringParameters?.keyword || "복숭아";

  let items = [];
  let errorMessage = null;

  try {
    const data = await fetchNaverShopping(keyword);
    items = convertItems(data);
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
      source: "naver-shopping-search",
      keyword,
      errorMessage,
      summary: makeSummary(items),
      items,
    }),
  };
}