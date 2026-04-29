import {
  makeTop20,
  makeTrendMap,
} from "../../src/utils/trendTransform.js";

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDateRange(year) {
  const today = new Date();
  const currentYear = today.getFullYear();

  const startDate = `${year - 1}-01-01`;
  const endDate =
    year === currentYear
      ? formatDate(today)
      : `${year}-12-31`;

  return { startDate, endDate };
}

async function fetchNaverTrend(keywords, year) {
  const url = "https://openapi.naver.com/v1/datalab/search";
  const { startDate, endDate } = getDateRange(year);

  const body = {
    startDate,
    endDate,
    timeUnit: "date",
    keywordGroups: keywords.map((k) => ({
      groupName: k,
      keywords: [k],
    })),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
    const lastYearMap = new Map();

    group.data.forEach((row) => {
      const d = new Date(`${row.period}T00:00:00`);
      if (d.getFullYear() === year - 1) {
        const key = row.period.slice(5);
        lastYearMap.set(key, Number(row.ratio || 0));
      }
    });

    group.data.forEach((row) => {
      const d = new Date(`${row.period}T00:00:00`);
      if (d.getFullYear() !== year) return;

      const key = row.period.slice(5);

      result.push({
        keyword: group.title,
        category: "과일",
        date: row.period,
        value: Number(row.ratio || 0),
        lastYearValue: lastYearMap.get(key) || 0,
        change: 0,
      });
    });
  });

  return result;
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

  const top20Data = makeTop20(rawData);
  const trendMap = makeTrendMap(rawData, year);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      ok: !errorMessage,
      source,
      year,
      errorMessage,
      top20Data,
      trendMap,
    }),
  };
}