const API_BASE = "/.netlify/functions";

export async function fetchTrendData({ year = 2025, category = "all" } = {}) {
  const query = new URLSearchParams({
    year: String(year),
    category,
  });

  const res = await fetch(`${API_BASE}/trend?${query.toString()}`);

  if (!res.ok) {
    throw new Error(`trend API 실패: ${res.status}`);
  }

  return res.json();
}