const API_BASE = "/.netlify/functions";

export async function fetchTrendData({ year, category = "all", period = "7" }) {
  const params = new URLSearchParams();

  if (year) params.set("year", String(year));
  if (category) params.set("category", category);
  if (period) params.set("period", String(period));

  const res = await fetch(`${API_BASE}/trend?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`trend API 실패: ${res.status}`);
  }

  const data = await res.json();

  if (data.ok === false) {
    throw new Error(data.errorMessage || "trend API 응답 오류");
  }

  return data;
}