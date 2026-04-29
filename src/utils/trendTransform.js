import { getWeekLabel } from "./dateUtils.js";

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function round(value, digits = 2) {
  return Number(toNumber(value).toFixed(digits));
}

function getRecentRows(rows, days) {
  return [...rows]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, days);
}

function average(rows, key = "value") {
  if (!rows.length) return 0;
  return rows.reduce((sum, row) => sum + toNumber(row[key]), 0) / rows.length;
}

function slope(rows) {
  if (rows.length < 2) return 0;

  const sorted = [...rows].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );

  const first = toNumber(sorted[0].value);
  const last = toNumber(sorted[sorted.length - 1].value);

  return last - first;
}

function groupMonthlyCompare(rows, year) {
  const result = Array.from({ length: 12 }, (_, i) => ({
    label: `${i + 1}월`,
    valueSum: 0,
    valueCount: 0,
    lastYearSum: 0,
    lastYearCount: 0,
  }));

  rows.forEach((row) => {
    const d = new Date(`${row.date}T00:00:00`);
    const rowYear = Number(row.year || d.getFullYear());
    const monthIndex = d.getMonth();

    if (rowYear === year) {
      result[monthIndex].valueSum += toNumber(row.value);
      result[monthIndex].valueCount += 1;
    }

    if (rowYear === year - 1) {
      result[monthIndex].lastYearSum += toNumber(row.value);
      result[monthIndex].lastYearCount += 1;
    }
  });

  return result.map((item) => ({
    label: item.label,
    value: item.valueCount ? round(item.valueSum / item.valueCount) : 0,
    lastYear: item.lastYearCount
      ? round(item.lastYearSum / item.lastYearCount)
      : 0,
  }));
}

function groupWeeklyCompare(rows, year) {
  const map = new Map();

  rows.forEach((row) => {
    const d = new Date(`${row.date}T00:00:00`);
    const rowYear = Number(row.year || d.getFullYear());
    const label = getWeekLabel(row.date);

    if (!map.has(label)) {
      map.set(label, {
        label,
        valueSum: 0,
        valueCount: 0,
        lastYearSum: 0,
        lastYearCount: 0,
      });
    }

    const item = map.get(label);

    if (rowYear === year) {
      item.valueSum += toNumber(row.value);
      item.valueCount += 1;
    }

    if (rowYear === year - 1) {
      item.lastYearSum += toNumber(row.value);
      item.lastYearCount += 1;
    }
  });

  return Array.from(map.values()).map((item) => ({
    label: item.label,
    value: item.valueCount ? round(item.valueSum / item.valueCount) : 0,
    lastYear: item.lastYearCount
      ? round(item.lastYearSum / item.lastYearCount)
      : 0,
  }));
}

function makeYearCompare(rows, year) {
  const map = new Map();

  rows.forEach((row) => {
    const d = new Date(`${row.date}T00:00:00`);
    const rowYear = Number(row.year || d.getFullYear());
    const monthDay = row.date.slice(5);

    if (!map.has(monthDay)) {
      map.set(monthDay, {
        monthDay,
        value: 0,
        lastYear: 0,
      });
    }

    const item = map.get(monthDay);

    if (rowYear === year) {
      item.value = toNumber(row.value);
    }

    if (rowYear === year - 1) {
      item.lastYear = toNumber(row.value);
    }
  });

  return Array.from(map.values())
    .sort((a, b) => a.monthDay.localeCompare(b.monthDay))
    .map((item) => ({
      date: `${year}-${item.monthDay}`,
      value: round(item.value),
      lastYear: round(item.lastYear),
      year,
    }));
}

export function makeTop20(rawData, period = "7") {
  const selectedDays = Number(period || 7);
  const grouped = new Map();

  rawData.forEach((row) => {
    if (!grouped.has(row.keyword)) {
      grouped.set(row.keyword, []);
    }

    grouped.get(row.keyword).push(row);
  });

  return Array.from(grouped.entries())
    .map(([keyword, rows]) => {
      const selectedRows = getRecentRows(rows, selectedDays);
      const rows7 = getRecentRows(rows, 7);
      const rows14 = getRecentRows(rows, 14);
      const rows21 = getRecentRows(rows, 21);

      const avgSensitivity = average(selectedRows);

      const slopeScore =
        slope(rows7) * 0.5 +
        slope(rows14) * 0.3 +
        slope(rows21) * 0.2;

      const score = avgSensitivity * 0.7 + slopeScore * 0.3;
      const latest = getRecentRows(rows, 1)[0];

      return {
        keyword,
        category: latest?.category || "-",
        parentCategory: latest?.parentCategory || "-",
        avgSensitivity: round(avgSensitivity),
        slopeScore: round(slopeScore),
        score: round(score),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

export function makeTrendMap(rawData, year) {
  const grouped = new Map();

  rawData.forEach((row) => {
    if (!grouped.has(row.keyword)) {
      grouped.set(row.keyword, []);
    }

    grouped.get(row.keyword).push({
      ...row,
      value: toNumber(row.value),
    });
  });

  const result = {};

  grouped.forEach((rows, keyword) => {
    const sorted = [...rows].sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );

    result[keyword] = {
      monthly: groupMonthlyCompare(sorted, year),
      weekly: groupWeeklyCompare(sorted, year),
      yearCompare: makeYearCompare(sorted, year),
    };
  });

  return result;
}