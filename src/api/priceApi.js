const API_BASE = "/.netlify/functions";

export async function fetchPriceData(keyword = "복숭아") {
  const query = new URLSearchParams({
    keyword,
  });

  const res = await fetch(`${API_BASE}/price?${query.toString()}`);

  if (!res.ok) {
    throw new Error(`price API 실패: ${res.status}`);
  }

  return res.json();
}