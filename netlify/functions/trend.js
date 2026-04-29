import { makeTop20, makeTrendMap } from "../../src/utils/trendTransform.js";

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDateRange(year) {
  const today = new Date();
  const currentYear = today.getFullYear();

  return {
    startDate: `${year - 1}-01-01`,
    endDate: year === currentYear ? formatDate(today) : `${year}-12-31`,
  };
}

async function fetchNaverTrend(keywords, year) {
  const { startDate, endDate } = getDateRange(year);

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
      keywordGroups: keywords.map((k) => ({
        groupName: k,
        keywords: [k],
      })),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`NAVER TREND API 실패 ${res.status}: ${errorText}`);
  }

  return res.json();
}

function convertToRaw(naverData, year) {
  const result = [];

  naverData.results.forEach((group) => {
    const currentMap = new Map();
    const lastYearMap = new Map();

    group.data.forEach((row) => {
      const d = new Date(`${row.period}T00:00:00`);
      const key = row.period.slice(5);
      const value = Number(row.ratio || 0);

      if (d.getFullYear() === year) {
        currentMap.set(key, value);
      }

      if (d.getFullYear() === year - 1) {
        lastYearMap.set(key, value);
      }
    });

    const allKeys = new Set([...currentMap.keys(), ...lastYearMap.keys()]);

    allKeys.forEach((key) => {
      const value = currentMap.get(key) || 0;
      const lastYearValue = lastYearMap.get(key) || 0;

      result.push({
        keyword: group.title,
        category: "과일",
        date: `${year}-${key}`,
        value,
        lastYearValue,
        change:
          lastYearValue === 0
            ? 0
            : ((value - lastYearValue) / lastYearValue) * 100,
      });
    });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export async function handler(event) {
  const today = new Date();
  const year = Number(event.queryStringParameters?.year || today.getFullYear());

  let rawData = [];
  let source = "naver";
  let errorMessage = null;

  try {
    const keywords = ["복숭아", "사과", "수박"];
    const naverData = await fetchNaverTrend(keywords, year);
    rawData = convertToRaw(naverData, year);
  } catch (e) {
    source = "error";
    errorMessage = e.message;
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      ok: !errorMessage,
      source,
      year,
      errorMessage,
      top20Data: makeTop20(rawData),
      trendMap: makeTrendMap(rawData, year),
    }),
  };
}