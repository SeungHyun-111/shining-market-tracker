import { useMemo, useState } from "react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

export default function PriceSection({
  priceItems = [],
  priceSummary,
  selectedKeyword,
  priceLoading,
  priceError,
}) {
  const [sortKey, setSortKey] = useState("priceAsc");

  const sortedItems = useMemo(() => {
    const copied = [...priceItems];

    if (sortKey === "priceAsc") {
      return copied.sort((a, b) => a.price - b.price);
    }

    if (sortKey === "priceDesc") {
      return copied.sort((a, b) => b.price - a.price);
    }

    if (sortKey === "titleAsc") {
      return copied.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    }

    if (sortKey === "mallAsc") {
      return copied.sort((a, b) => a.mall.localeCompare(b.mall, "ko"));
    }

    return copied;
  }, [priceItems, sortKey]);

  const summary = priceSummary || {
    minPrice: 0,
    maxPrice: 0,
    avgPrice: 0,
    count: 0,
  };

  return (
    <section className="price-section">
      <div className="section-header">
        <div>
          <h2>가격 정보</h2>
          <p>{selectedKeyword} 기준 네이버 쇼핑 검색 가격</p>
        </div>

        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="priceAsc">가격 낮은순</option>
          <option value="priceDesc">가격 높은순</option>
          <option value="titleAsc">상품명순</option>
          <option value="mallAsc">판매처순</option>
        </select>
      </div>

      <div className="price-summary">
        <div>
          <span>최저가</span>
          <strong>{formatNumber(summary.minPrice)}원</strong>
        </div>
        <div>
          <span>최고가</span>
          <strong>{formatNumber(summary.maxPrice)}원</strong>
        </div>
        <div>
          <span>평균가</span>
          <strong>{formatNumber(summary.avgPrice)}원</strong>
        </div>
        <div>
          <span>상품수</span>
          <strong>{formatNumber(summary.count)}개</strong>
        </div>
      </div>

      {priceLoading && <p className="muted">가격 정보를 불러오는 중입니다.</p>}
      {priceError && <p className="error-text">{priceError}</p>}

      <div className="price-table-wrap">
        <table className="price-table">
          <thead>
            <tr>
              <th>상품명</th>
              <th>판매처</th>
              <th>가격</th>
              <th>규격</th>
              <th>단위가</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.productId || item.link}>
                <td>
                  <a href={item.link} target="_blank" rel="noreferrer">
                    {item.title}
                  </a>
                </td>
                <td>{item.mall}</td>
                <td>{formatNumber(item.price)}원</td>
                <td>
                  {item.unitText ||
                    (item.count ? `${item.count}${item.countUnit}` : "-")}
                </td>
                <td>
                  {item.pricePerKg
                    ? `${formatNumber(item.pricePerKg)}원/kg`
                    : item.pricePerCount
                      ? `${formatNumber(item.pricePerCount)}원/${item.countUnit}`
                      : "-"}
                </td>
              </tr>
            ))}

            {!priceLoading && sortedItems.length === 0 && (
              <tr>
                <td colSpan="5">표시할 가격 정보가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}