function stripHtml(value = "") {
  return String(value).replace(/<[^>]*>/g, "").trim();
}

function toNumber(value) {
  return Number(String(value || "0").replace(/[^\d]/g, "")) || 0;
}

function normalizeText(value = "") {
  return stripHtml(value)
    .replace(/\s+/g, "")
    .toLowerCase();
}

function getMiddleCategoryKey(item) {
  return [item.category1, item.category2].filter(Boolean).join(">");
}

function pickMainMiddleCategory(items, keyword) {
  const normalizedKeyword = normalizeText(keyword);

  const keywordItems = items.filter((item) =>
    normalizeText(item.title).includes(normalizedKeyword)
  );

  const countMap = new Map();

  keywordItems.forEach((item) => {
    const key = getMiddleCategoryKey(item);
    if (!key) return;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });

  return [...countMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function filterByKeywordAndMiddleCategory(items, keyword) {
  const normalizedKeyword = normalizeText(keyword);
  const mainCategoryKey = pickMainMiddleCategory(items, keyword);

  return items.filter((item) => {
    const keywordOk = normalizeText(item.title).includes(normalizedKeyword);
    const categoryOk = mainCategoryKey
      ? getMiddleCategoryKey(item) === mainCategoryKey
      : true;

    return keywordOk && categoryOk;
  });
}

function normalizeProduct(title, price) {
  const cleanTitle = stripHtml(title);

  const kgMatch = cleanTitle.match(/(\d+(?:\.\d+)?)\s*kg/i);
  const gMatch = cleanTitle.match(/(\d+(?:\.\d+)?)\s*g/i);
  const countMatch = cleanTitle.match(/(\d+)\s*(개|입|팩|봉|과|구|송이)/);

  let unitText = "-";
  let weightG = 0;
  let count = 0;
  let countUnit = "";

  if (kgMatch) {
    weightG = Number(kgMatch[1]) * 1000;
    unitText = `${kgMatch[1]}kg`;
  } else if (gMatch) {
    weightG = Number(gMatch[1]);
    unitText = `${gMatch[1]}g`;
  }

  if (countMatch) {
    count = Number(countMatch[1]);
    countUnit = countMatch[2];
    if (unitText === "-") unitText = `${count}${countUnit}`;
  }

  const pricePerKg =
    weightG > 0 ? Math.round(price / (weightG / 1000)) : 0;

  const pricePerCount =
    count > 0 ? Math.round(price / count) : 0;

  return {
    unitText,
    weightG,
    count,
    countUnit,
    pricePerKg,
    pricePerCount,
  };
}

function convertItems(data) {
  return (data.items || []).map((item) => {
    const title = stripHtml(item.title);
    const price = toNumber(item.lprice);
    const highPrice = toNumber(item.hprice);
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
  });
}

function makeSummary(items) {
  const prices = items
    .map((item) => Number(item.price || 0))
    .filter((price) => price > 0);

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
    avgPrice: Math.round(
      prices.reduce((sum, price) => sum + price, 0) / prices.length
    ),
    count: items.length,
  };
}

async function fetchShopping(keyword) {
  const url = new URL("https://openapi.naver.com/v1/search/shop.json");

  url.searchParams.set("query", keyword);
  url.searchParams.set("display", "100");
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "sim");

  const res = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`NAVER SHOPPING API 실패 ${res.status}: ${errorText}`);
  }

  return res.json();
}

export async function handler(event) {
  const keyword = event.queryStringParameters?.keyword || "";

  if (!keyword) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        ok: false,
        keyword: "",
        items: [],
        summary: {
          minPrice: 0,
          maxPrice: 0,
          avgPrice: 0,
          count: 0,
        },
      }),
    };
  }
  try {
    const data = await fetchShopping(keyword);

    const convertedItems = convertItems(data);
    const filteredItems = filterByKeywordAndMiddleCategory(
      convertedItems,
      keyword
    );

    const sortedItems = filteredItems
      .filter((item) => item.price > 0)
      .sort((a, b) => a.price - b.price);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        ok: true,
        keyword,
        categoryKey:
          sortedItems.length > 0 ? getMiddleCategoryKey(sortedItems[0]) : "",
        items: sortedItems,
        summary: makeSummary(sortedItems),
      }),
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        ok: false,
        keyword,
        errorMessage: error.message,
        items: [],
        summary: {
          minPrice: 0,
          maxPrice: 0,
          avgPrice: 0,
          count: 0,
        },
      }),
    };
  }
}