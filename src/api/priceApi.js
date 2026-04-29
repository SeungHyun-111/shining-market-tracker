const API_BASE = "/.netlify/functions";

export async function fetchPriceData(keyword = "") {
  if (!keyword) {
    return {
      ok: false,
      keyword: "",
      items: [],
      summary: {
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        count: 0,
      },
    };
  }

  const query = new URLSearchParams({ keyword });
  const res = await fetch(`${API_BASE}/price?${query.toString()}`);

  if (!res.ok) {
    throw new Error(`price API 실패: ${res.status}`);
  }

  return res.json();
}