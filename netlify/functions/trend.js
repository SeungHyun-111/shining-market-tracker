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

async function fetchNaverTrend(keywords) {
  const url = "https://openapi.naver.com/v1/datalab/search";

  const body = {
    startDate: "2025-01-01",
    endDate: "2025-12-31",
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
    throw new Error(`NAVER API 실패 ${res.status}: ${errorText}`);
  }

  return res.json();
}

function convertToRaw(naverData) {
  const result = [];

  naverData.results.forEach((group) => {
    group.data.forEach((row) => {
      result.push({
        keyword: group.title,
        category: "과일",
        date: row.period,
        value: row.ratio,
        lastYearValue: row.ratio * 0.8,
        change: 0,
      });
    });
  });

  return result;
}

function makeDummy(year) {
  const result = [];
  const start = new Date(year, 0, 1);

  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    result.push({
      keyword: "복숭아",
      category: "과일",
      date: formatDate(d),
      value: Math.random() * 100,
      lastYearValue: Math.random() * 80,
      change: 0,
    });
  }

  return result;
}

export async function handler(event) {
  const year = Number(event.queryStringParameters?.year || 2025);

  let rawData;
  let source = "naver";
  let errorMessage = null;

  try {
    const keywords = ["복숭아", "사과", "수박"];
    const naverData = await fetchNaverTrend(keywords);
    rawData = convertToRaw(naverData);
  } catch (e) {
    source = "dummy";
    errorMessage = e.message;
    rawData = makeDummy(year);
  }

  const top20Data = makeTop20(rawData);
  const trendMap = makeTrendMap(rawData, year);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      ok: true,
      source,
      year,
      errorMessage,
      env: {
        clientIdExists: !!process.env.NAVER_CLIENT_ID,
        clientSecretExists: !!process.env.NAVER_CLIENT_SECRET,
      },
      top20Data,
      trendMap,
    }),
  };
}