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

function getMonthLabel(date) {
  const [, month] = String(date).split("-");
  return `${Number(month)}월`;
}

function getWeekLabel(date) {
  const d = new Date(`${date}T00:00:00`);
  const month = d.getMonth() + 1;
  const week = Math.ceil(d.getDate() / 7);
  return `${month}월 ${week}주`;
}

function groupAverage(rows, labelGetter) {
  const map = new Map();

  rows.forEach((row) => {
    const label = labelGetter(row.date);

    if (!map.has(label)) {
      map.set(label, {
        label,
        valueSum: 0,
        lastYearSum: 0,
        count: 0,
      });
    }

    const item = map.get(label);
    item.valueSum += toNumber(row.value);
    item.lastYearSum += toNumber(row.lastYearValue);
    item.count += 1;
  });

  return Array.from(map.values()).map((item) => ({
    label: item.label,
    value: round(item.valueSum / item.count),
    lastYear: round(item.lastYearSum / item.count),
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
      lastYearValue: toNumber(row.lastYearValue),
    });
  });

  const result = {};

  grouped.forEach((rows, keyword) => {
    const sorted = [...rows].sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );

    result[keyword] = {
      monthly: groupAverage(sorted, getMonthLabel),
      weekly: groupAverage(sorted, getWeekLabel),
      yearCompare: sorted.map((row) => ({
        date: row.date,
        value: round(row.value),
        lastYear: round(row.lastYearValue),
        year,
      })),
    };
  });

  return result;
}