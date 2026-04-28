function stripHtml(text = "") {
  return text.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').trim();
}

function toNumber(value) {
  const number = Number(String(value || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

async function fetchNaverShopping(keyword) {
  const query = new URLSearchParams({
    query: keyword,
    display: "20",
    start: "1",
    sort: "sim",
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
    throw new Error(`NAVER SHOPPING API 실패 ${res.status}: ${errorText}`);
  }

  return res.json();
}

function convertItems(naverData) {
  return (naverData.items || []).map((item) => ({
    title: stripHtml(item.title),
    link: item.link,
    image: item.image,
    mall: item.mallName,
    price: toNumber(item.lprice),
    highPrice: toNumber(item.hprice),
    brand: item.brand,
    maker: item.maker,
    category1: item.category1,
    category2: item.category2,
    category3: item.category3,
    category4: item.category4,
    productId: item.productId,
    productType: item.productType,
    delivery: "확인필요",
    review: null,
  }));
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

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(
    prices.reduce((sum, price) => sum + price, 0) / prices.length
  );

  return {
    minPrice,
    maxPrice,
    avgPrice,
    count: prices.length,
  };
}

export async function handler(event) {
  const keyword = event.queryStringParameters?.keyword || "복숭아";

  let source = "naver-shopping";
  let errorMessage = null;
  let items = [];

  try {
    const naverData = await fetchNaverShopping(keyword);
    items = convertItems(naverData);
  } catch (e) {
    source = "error";
    errorMessage = e.message;
    items = [];
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      ok: source !== "error",
      source,
      keyword,
      errorMessage,
      env: {
        clientIdExists: !!process.env.NAVER_CLIENT_ID,
        clientSecretExists: !!process.env.NAVER_CLIENT_SECRET,
      },
      summary: makeSummary(items),
      items,
    }),
  };
}