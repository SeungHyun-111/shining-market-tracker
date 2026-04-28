import {
  getMonthLabel,
  isSameYear,
} from "./dateUtils";

function average(numbers) {
  if (!numbers.length) return 0;

  const sum = numbers.reduce((acc, value) => acc + Number(value || 0), 0);
  return Number((sum / numbers.length).toFixed(2));
}

function groupBy(data, keyGetter) {
  return data.reduce((acc, item) => {
    const key = keyGetter(item);

    if (!acc[key]) {
      acc[key] = [];
    }

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

  return Object.entries(grouped).map(([label, rows]) => ({
    label,
    value: average(rows.map((item) => item.value)),
    lastYear: average(rows.map((item) => item.lastYearValue)),
  }));
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
  return rawData
    .filter((item) => isSameYear(item.date, year))
    .map((item) => ({
      date: item.date,
      value: Number(item.value || 0),
      lastYear: Number(item.lastYearValue || 0),
    }));
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