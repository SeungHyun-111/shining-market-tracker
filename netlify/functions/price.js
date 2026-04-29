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
  const query = new URLSearchParams({
    query: keyword,
    display: "30",
    start: "1",
    sort: "asc",
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
  return (data.items || []).map((item) => {
    const lprice = toNumber(item.lprice);
    const hprice = toNumber(item.hprice);

    return {
      title: stripHtml(item.title),
      link: item.link,
      image: item.image,
      mall: item.mallName,
      price: lprice,
      highPrice: hprice,
      brand: item.brand || "",
      maker: item.maker || "",
      category1: item.category1 || "",
      category2: item.category2 || "",
      category3: item.category3 || "",
      category4: item.category4 || "",
      productId: item.productId,
      productType: item.productType,
    };
  });
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