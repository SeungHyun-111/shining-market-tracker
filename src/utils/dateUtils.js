export function parseDate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

export function getMonthKey(dateString) {
  const date = parseDate(dateString);
  return date.getMonth() + 1;
}

export function getMonthLabel(dateString) {
  return `${getMonthKey(dateString)}월`;
}

export function getMonday(date) {
  const copied = new Date(date);
  const day = copied.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  copied.setDate(copied.getDate() + diff);
  copied.setHours(0, 0, 0, 0);

  return copied;
}

export function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekOfMonth(dateString) {
  const date = parseDate(dateString);
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstMonday = getMonday(firstDay);

  const diffDays = Math.floor((date - firstMonday) / (1000 * 60 * 60 * 24));

  return Math.floor(diffDays / 7) + 1;
}

export function getWeekLabel(dateString) {
  const month = getMonthKey(dateString);
  const week = getWeekOfMonth(dateString);

  return `${month}월 ${week}주차`;
}

export function isSameYear(dateString, year) {
  return parseDate(dateString).getFullYear() === year;
}