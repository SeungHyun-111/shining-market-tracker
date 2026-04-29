import { makeTop20, makeTrendMap } from "../../src/utils/trendTransform.js";
import { FOOD_KEYWORDS } from "../../src/constants/foodKeywords.js";

const MAX_TREND_KEYWORDS = 50;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  };
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange(year) {
  const today = new Date();
  const currentYear = today.getFullYear();

  return {
    startDate: `${year - 1}-01-01`,
    endDate: year === currentYear ? formatDate(today) : `${year}-12-31`,
  };
}

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function makeKeywordPool() {
  const keywordPool = Object.entries(FOOD_KEYWORDS).flatMap(([category, keywords]) =>
    keywords.map((keyword) => ({
      keyword,
      category,
    }))
  );

  const category3Pool = Object.keys(FOOD_KEYWORDS).map((category) => ({
    keyword: category,
    category,
  }));

  return { category3Pool, keywordPool };
}

async function fetchNaverTrend(keywordItems, year) {
  if (!keywordItems.length) {
    return { results: [] };
  }

  const { startDate, endDate } = getDateRange(year);
  const results = [];

  for (const batch of chunk(keywordItems, 5)) {
    const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        timeUnit: "date",
        keywordGroups: batch.map((item) => ({
          groupName: item.keyword,
          keywords: [item.keyword],
        })),
      }),
    });

    if (!res.ok) {
      throw new Error(`NAVER DATALAB API 실패 ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    results.push(...(data.results || []));
  }

  return { results };
}

function convertToRaw(naverData, keywordItems) {
  const categoryMap = new Map(
    keywordItems.map((item) => [item.keyword, item.category])
  );

  const rawData = [];

  (naverData.results || []).forEach((group) => {
    (group.data || []).forEach((row) => {
      const d = new Date(`${row.period}T00:00:00`);

      rawData.push({
        keyword: group.title,
        category: categoryMap.get(group.title) || "-",
        parentCategory: "-",
        date: row.period,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        value: Number(row.ratio || 0),
      });
    });
  });

  return rawData;
}

export async function handler(event) {
  const year = Number(
    event.queryStringParameters?.year || new Date().getFullYear()
  );
  const category = event.queryStringParameters?.category || "all";
  const period = event.queryStringParameters?.period || "7";
  const debug = event.queryStringParameters?.debug;

  try {
    const { category3Pool, keywordPool } = makeKeywordPool();

    if (debug === "pool") {
      return json(200, {
        count: category3Pool.length,
        keywordPool: category3Pool,
      });
    }

    if (debug === "items") {
      return json(200, {
        count: keywordPool.length,
        keywordPool,
      });
    }

    const filtered =
      category === "all"
        ? keywordPool
        : keywordPool.filter((item) => item.category === category);

    const trendTargets = filtered.slice(0, MAX_TREND_KEYWORDS);

    const naverData = await fetchNaverTrend(trendTargets, year);
    const rawData = convertToRaw(naverData, trendTargets);

    return json(200, {
      ok: true,
      year,
      category,
      period,
      totalKeywordCount: keywordPool.length,
      filteredKeywordCount: filtered.length,
      trendTargetCount: trendTargets.length,
      category3Pool,
      keywordPool: trendTargets,
      top20Data: makeTop20(rawData, period),
      trendMap: makeTrendMap(rawData, year),
    });
  } catch (error) {
    return json(200, {
      ok: false,
      errorMessage: error.message,
      keywordPool: [],
      top20Data: [],
      trendMap: {},
    });
  }
}