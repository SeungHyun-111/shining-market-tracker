import { getMonthLabel, isSameYear } from "./dateUtils";

function average(numbers) {
  const valid = numbers.filter((v) => Number.isFinite(Number(v)));
  if (!valid.length) return 0;

  const sum = valid.reduce((acc, value) => acc + Number(value || 0), 0);
  return Number((sum / valid.length).toFixed(2));
}

function groupBy(data, keyGetter) {
  return data.reduce((acc, item) => {
    const key = keyGetter(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function getWeekKey(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  const firstDay = new Date(year, d.getMonth(), 1);
  const dayOfWeek = firstDay.getDay() || 7;
  const offset = d.getDate() + dayOfWeek - 1;
  const week = Math.ceil(offset / 7);

  return `${year}-${String(month).padStart(2, "0")}-${week}주차`;
}

function makeWeeklyTrend(rawData, year) {
  const yearData = rawData.filter((item) => isSameYear(item.date, year));
  const grouped = groupBy(yearData, (item) => getWeekKey(item.date));

  return Object.entries(grouped)
    .map(([label, rows]) => ({
      label,
      value: average(rows.map((item) => item.value)),
      lastYear: average(rows.map((item) => item.lastYearValue)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function makeMonthlyTrend(rawData, year) {
  const yearData = rawData.filter((item) => isSameYear(item.date, year));
  const grouped = groupBy(yearData, (item) => getMonthLabel(item.date));

  return Array.from({ length: 12 }).map((_, index) => {
    const label = `${index + 1}월`;
    const rows = grouped[label] || [];

    return {
      label,
      value: average(rows.map((item) => item.value)),
      lastYear: average(rows.map((item) => item.lastYearValue)),
    };
  });
}

export function makeYearCompare(rawData, year) {
  const yearData = rawData.filter((item) => isSameYear(item.date, year));
  const dataMap = new Map(yearData.map((item) => [item.date, item]));

  const result = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const date = `${yyyy}-${mm}-${dd}`;

    const item = dataMap.get(date);

    result.push({
      date,
      value: Number(item?.value || 0),
      lastYear: Number(item?.lastYearValue || 0),
    });
  }

  return result;
}

export function makeTop20(rawData) {
  const grouped = groupBy(rawData, (item) => item.keyword);

  return Object.entries(grouped)
    .map(([keyword, rows]) => {
      const latest = rows[rows.length - 1];

      return {
        keyword,
        category: latest.category,
        sensitivity: average(rows.map((item) => item.value)),
        change: average(rows.map((item) => item.change || 0)),
      };
    })
    .sort((a, b) => b.sensitivity - a.sensitivity)
    .slice(0, 20)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
}

export function makeTrendMap(rawData, year) {
  const grouped = groupBy(rawData, (item) => item.keyword);

  return Object.entries(grouped).reduce((acc, [keyword, rows]) => {
    acc[keyword] = {
      monthly: makeMonthlyTrend(rows, year),
      weekly: makeWeeklyTrend(rows, year),
      yearCompare: makeYearCompare(rows, year),
    };

    return acc;
  }, {});
}