const keywords = [
  ["복숭아", "과일", 2.48, 142.6],
  ["자두", "과일", 1.89, 112.7],
  ["수박", "과일", 1.72, 98.3],
  ["옥수수", "채소", 1.36, 76.5],
  ["참외", "과일", 1.21, 65.2],
  ["블루베리", "과일", 1.08, 58.7],
  ["토마토", "채소", 0.97, 45.1],
  ["오이", "채소", 0.86, 32.8],
  ["사과", "과일", 0.78, 28.4],
  ["상추", "채소", 0.69, 25.3],
  ["배", "과일", 0.65, 18.9],
  ["포도", "과일", 0.59, 17.6],
  ["고구마", "채소", 0.52, 15.3],
  ["감귤", "과일", 0.45, 12.7],
  ["양파", "채소", 0.42, 8.6],
  ["깻잎", "채소", 0.35, 6.2],
  ["대파", "채소", 0.31, 4.1],
  ["방울토마토", "채소", 0.28, 2.3],
  ["마늘", "채소", 0.24, -1.2],
  ["감자", "채소", 0.21, -3.8],
];

export const top20Data = keywords.map(
  ([keyword, category, sensitivity, change], index) => ({
    rank: index + 1,
    keyword,
    category,
    sensitivity,
    change,
  })
);

function toDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getWeekOfMonth(date) {
  return Math.ceil(date.getDate() / 7);
}

function makeDailyTrend(days = 365, seed = 0) {
  return Array.from({ length: days }).map((_, i) => {
    const date = new Date(2024, 0, 1 + i);
    const label = toDateKey(date);

    return {
      label,
      date: label,
      value: Number((1.2 + Math.sin((i + seed) / 15) + i / 260).toFixed(2)),
      lastYear: Number((1 + Math.sin((i + seed) / 18) + i / 320).toFixed(2)),
    };
  });
}

function average(rows, key) {
  if (!rows.length) return 0;
  return Number(
    (rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length).toFixed(2)
  );
}

function makeMonthlyTrend(dailyData) {
  return Array.from({ length: 12 }).map((_, monthIndex) => {
    const monthRows = dailyData.filter((row) => {
      const d = new Date(row.date);
      return d.getMonth() === monthIndex;
    });

    return {
      label: `${monthIndex + 1}월`,
      value: average(monthRows, "value"),
      lastYear: average(monthRows, "lastYear"),
    };
  });
}

function makeWeeklyTrend(dailyData) {
  const recentRows = dailyData.filter((row) => row.date >= "2024-04-01" && row.date <= "2024-05-31");

  const grouped = recentRows.reduce((acc, row) => {
    const d = new Date(row.date);
    const key = `${d.getMonth() + 1}월 ${getWeekOfMonth(d)}주차`;

    if (!acc[key]) acc[key] = [];
    acc[key].push(row);

    return acc;
  }, {});

  return Object.entries(grouped).map(([label, rows]) => ({
    label,
    value: average(rows, "value"),
    lastYear: average(rows, "lastYear"),
  }));
}

function makeTrendSet(seed) {
  const yearCompare = makeDailyTrend(365, seed);

  return {
    monthly: makeMonthlyTrend(yearCompare),
    weekly: makeWeeklyTrend(yearCompare),
    yearCompare,
  };
}

export const trendMap = {
  복숭아: makeTrendSet(0),
  사과: makeTrendSet(30),
  수박: makeTrendSet(60),
};

export const yearCompareTrend = trendMap.복숭아.yearCompare;

export const priceItemsMap = {
  복숭아: [
    { title: "[GAP] 경북 영천 복숭아 특품", weight: "2kg", mall: "○○농산", price: 18_900, delivery: "무료", review: 1_234 },
    { title: "당도선별 복숭아 선물용", weight: "2.5kg", mall: "스마트팜", price: 21_500, delivery: "3,000", review: 856 },
    { title: "복숭아 황도 가정용", weight: "3kg", mall: "□□푸드", price: 15_900, delivery: "무료", review: 432 },
  ],
  사과: [
    { title: "사과 5kg", weight: "5kg", mall: "네이버", price: 22_000, delivery: "무료", review: 821 },
    { title: "사과 특품", weight: "3kg", mall: "쿠팡", price: 25_000, delivery: "3,000", review: 640 },
  ],
  수박: [
    { title: "고당도 수박 7kg", weight: "7kg", mall: "산지직송", price: 19_800, delivery: "무료", review: 542 },
    { title: "수박 특품 8kg", weight: "8kg", mall: "프레시몰", price: 23_900, delivery: "3,000", review: 311 },
  ],
};