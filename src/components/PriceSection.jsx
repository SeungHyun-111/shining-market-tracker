import { useMemo, useState } from "react";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function parseNumber(value) {
  return Number(String(value || "").replace(/[^\d]/g, "")) || 0;
}

function safeText(value) {
  return value ? String(value) : "-";
}

function normalize(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function getUnitLabel(item) {
  if (item?.unitText) return item.unitText;
  if (item?.count) return `${item.count}${item.countUnit || "개"}`;
  return "-";
}

function getUnitPrice(item) {
  if (item?.pricePerKg) return `${formatNumber(item.pricePerKg)}원/kg`;
  if (item?.pricePerCount) return `${formatNumber(item.pricePerCount)}원/${item.countUnit || "개"}`;
  return "-";
}

export default function PriceSection({
  priceItems,
  selectedKeyword,
  priceLoading,
  priceError,
}) {
  const [excludeText, setExcludeText] = useState("");
  const [targetPriceText, setTargetPriceText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "price", direction: "asc" });

  const items = Array.isArray(priceItems) ? priceItems : [];
  const targetPrice = parseNumber(targetPriceText);

  const excludeWords = useMemo(() => {
    return excludeText.split(",").map((word) => normalize(word)).filter(Boolean);
  }, [excludeText]);

  const filteredItems = useMemo(() => {
    if (!excludeWords.length) return items;

    return items.filter((item) => {
      const targetText = normalize([
        item.title,
        item.mall,
        item.brand,
        item.maker,
        item.category1,
        item.category2,
        item.category3,
        item.category4,
      ].join(" "));

      return !excludeWords.some((word) => targetText.includes(word));
    });
  }, [items, excludeWords]);

  const dynamicSummary = useMemo(() => {
    const prices = filteredItems.map((item) => Number(item.price || 0)).filter(Boolean);

    if (!prices.length) {
      return { minPrice: 0, maxPrice: 0, avgPrice: 0, count: 0 };
    }

    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgPrice: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
      count: filteredItems.length,
    };
  }, [filteredItems]);

  const priceSortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }, [filteredItems]);

  const pricePosition = useMemo(() => {
    if (!targetPrice || !priceSortedItems.length) return null;

    const prices = priceSortedItems.map((item) => Number(item.price || 0)).filter(Boolean);
    const cheaperCount = prices.filter((price) => price < targetPrice).length;
    const expensiveCount = prices.filter((price) => price > targetPrice).length;
    const sameCount = prices.filter((price) => price === targetPrice).length;
    const rank = cheaperCount + 1;
    const totalWithTarget = prices.length + 1;
    const topPercent = Math.round((rank / totalWithTarget) * 100);

    return {
      cheaperCount,
      expensiveCount,
      sameCount,
      rank,
      totalWithTarget,
      topPercent,
    };
  }, [priceSortedItems, targetPrice]);

  const handleSort = (key) => {
    if (targetPrice) return;

    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }

      return { key, direction: "asc" };
    });
  };

  const sortedItems = useMemo(() => {
    if (targetPrice) return priceSortedItems;

    const copied = [...filteredItems];
    const dir = sortConfig.direction === "asc" ? 1 : -1;

    copied.sort((a, b) => {
      if (sortConfig.key === "title") {
        return safeText(a.title).localeCompare(safeText(b.title), "ko") * dir;
      }

      if (sortConfig.key === "mall") {
        return safeText(a.mall).localeCompare(safeText(b.mall), "ko") * dir;
      }

      if (sortConfig.key === "unit") {
        return ((a.weightG || a.count || 0) - (b.weightG || b.count || 0)) * dir;
      }

      if (sortConfig.key === "unitPrice") {
        return ((a.pricePerKg || a.pricePerCount || 0) - (b.pricePerKg || b.pricePerCount || 0)) * dir;
      }

      return (Number(a.price || 0) - Number(b.price || 0)) * dir;
    });

    return copied;
  }, [filteredItems, priceSortedItems, sortConfig, targetPrice]);

  const displayRows = useMemo(() => {
    if (!targetPrice || !pricePosition) return sortedItems;

    const topRows = priceSortedItems.slice(0, 5);
    const bottomRows = priceSortedItems.slice(-5);
    const topIds = new Set(topRows.map((item) => item.productId || item.link || item.title));
    const bottomIds = new Set(bottomRows.map((item) => item.productId || item.link || item.title));

    const rows = [];

    topRows.forEach((item) => rows.push(item));

    if (pricePosition.rank > 6) {
      rows.push({ isEllipsisRow: true, label: `${pricePosition.rank - 6}개 상품 생략` });
    }

    rows.push({
      isTargetPriceRow: true,
      title: "내 희망판매가",
      price: targetPrice,
      rank: pricePosition.rank,
    });

    const hiddenAfterCount =
      priceSortedItems.length -
      topRows.length -
      bottomRows.filter((item) => !topIds.has(item.productId || item.link || item.title)).length -
      Math.max(0, pricePosition.rank <= 5 ? 1 : 0);

    if (pricePosition.rank < priceSortedItems.length - 4) {
      rows.push({
        isEllipsisRow: true,
        label: `${Math.max(0, hiddenAfterCount)}개 상품 생략`,
      });
    }

    bottomRows.forEach((item) => {
      const key = item.productId || item.link || item.title;
      if (!topIds.has(key)) rows.push(item);
    });

    return rows;
  }, [pricePosition, priceSortedItems, sortedItems, targetPrice]);

  const SortMark = ({ column }) => {
    const activeKey = targetPrice ? "price" : sortConfig.key;
    const activeDirection = targetPrice ? "asc" : sortConfig.direction;

    if (activeKey !== column) return <span className="sort-mark">↕</span>;
    return <span className="sort-mark active">{activeDirection === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <section className="price-section">
      <div className="price-layout">
        <div className="section-card price-main-card">
          <div className="section-head price-head">
            <div>
              <h2>3. 시장 가격 현황 <span>(크롤링 기반)</span></h2>
              <p className="section-desc">
                {selectedKeyword} 네이버 쇼핑 상위 노출 상품 기준
              </p>
            </div>
          </div>

          <div className="target-price-panel">
            <div>
              <label>희망판매가</label>
              <p>입력하면 가격순으로 자동 정렬되고, 내 희망가 위치만 중심으로 보여줍니다.</p>
            </div>

            <div className="target-price-input-wrap">
              <input
                value={targetPriceText}
                onChange={(e) => setTargetPriceText(e.target.value)}
                placeholder="예: 29,900"
              />
              <span>원</span>
            </div>
          </div>

          <div className="exclude-line">
            <label>제외어</label>
            <input
              value={excludeText}
              onChange={(e) => setExcludeText(e.target.value)}
              placeholder="예: 즙, 주스, 냉동, 말랭이"
            />
            <span>쉼표(,) 기준 다중 제외</span>
          </div>

          {pricePosition && (
            <div className="target-price-summary">
              <div>
                <span>내 가격 위치</span>
                <strong>상위 {pricePosition.topPercent}%</strong>
              </div>
              <div>
                <span>가격 순위</span>
                <strong>{pricePosition.rank} / {pricePosition.totalWithTarget}</strong>
              </div>
              <div>
                <span>더 저렴한 상품</span>
                <strong>{formatNumber(pricePosition.cheaperCount)}개</strong>
              </div>
              <div>
                <span>더 비싼 상품</span>
                <strong>{formatNumber(pricePosition.expensiveCount)}개</strong>
              </div>
            </div>
          )}

          {priceLoading && <div className="price-state">가격 정보를 불러오는 중입니다.</div>}
          {priceError && <div className="price-state error-text">{priceError}</div>}

          <div className="price-table-wrap">
            <table className="price-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th onClick={() => handleSort("title")}>상품명 <SortMark column="title" /></th>
                  <th onClick={() => handleSort("unit")}>구성/중량 <SortMark column="unit" /></th>
                  <th onClick={() => handleSort("mall")}>판매처 <SortMark column="mall" /></th>
                  <th onClick={() => handleSort("price")}>가격(원) <SortMark column="price" /></th>
                  <th onClick={() => handleSort("unitPrice")}>단위가 <SortMark column="unitPrice" /></th>
                  <th>링크</th>
                </tr>
              </thead>

              <tbody>
                {displayRows.map((item, index) => {
                  if (item.isEllipsisRow) {
                    return (
                      <tr key={`ellipsis-${index}`} className="ellipsis-row">
                        <td colSpan="7">
                          <span>··· {item.label} ···</span>
                        </td>
                      </tr>
                    );
                  }

                  if (item.isTargetPriceRow) {
                    return (
                      <tr key="target-price-row" className="target-price-row">
                        <td>★ {item.rank}</td>
                        <td className="price-title-cell">
                          <strong>내 희망판매가</strong>
                          <span>현재 가격 리스트 기준 예상 위치</span>
                        </td>
                        <td>-</td>
                        <td>나의 기준가</td>
                        <td className="number-cell">{formatNumber(item.price)}</td>
                        <td>-</td>
                        <td>-</td>
                      </tr>
                    );
                  }

                  const realRank = priceSortedItems.findIndex((row) => {
                    const a = row.productId || row.link || row.title;
                    const b = item.productId || item.link || item.title;
                    return a === b;
                  }) + 1;

                  return (
                    <tr key={item.productId || item.link || `${item.title}-${index}`}>
                      <td>{targetPrice ? realRank : index + 1}</td>
                      <td className="price-title-cell">
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noreferrer">
                            {safeText(item.title)}
                          </a>
                        ) : (
                          safeText(item.title)
                        )}
                      </td>
                      <td>{getUnitLabel(item)}</td>
                      <td>{safeText(item.mall)}</td>
                      <td className="number-cell">{formatNumber(item.price)}</td>
                      <td className="number-cell">{getUnitPrice(item)}</td>
                      <td>
                        {item.link ? (
                          <a className="link-icon" href={item.link} target="_blank" rel="noreferrer">🔗</a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!priceLoading && displayRows.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      표시할 가격 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="price-note">
            ※ 제외어 적용 후 {formatNumber(items.length)}개 중 {formatNumber(filteredItems.length)}개 표시
          </p>
        </div>

        <aside className="section-card price-summary-card">
          <h3>가격 통계 <span>(표시 상품 기준)</span></h3>

          <dl>
            <div><dt>최저가</dt><dd>{formatNumber(dynamicSummary.minPrice)}원</dd></div>
            <div><dt>최고가</dt><dd>{formatNumber(dynamicSummary.maxPrice)}원</dd></div>
            <div><dt>평균가</dt><dd>{formatNumber(dynamicSummary.avgPrice)}원</dd></div>
            <div><dt>상품수</dt><dd>{formatNumber(dynamicSummary.count)}개</dd></div>
          </dl>

          {pricePosition && (
            <div className="target-side-box">
              <strong>희망판매가 포지션</strong>
              <p>
                내 희망가는 현재 표시 상품 기준
                <b> 상위 {pricePosition.topPercent}%</b> 수준입니다.
              </p>
              <p>
                더 저렴한 상품 {formatNumber(pricePosition.cheaperCount)}개,
                더 비싼 상품 {formatNumber(pricePosition.expensiveCount)}개입니다.
              </p>
            </div>
          )}

          <div className="price-tip-box">
            <strong>가격 데이터를 어떻게 활용할까?</strong>
            <p>✓ 희망가 기준 경쟁 상품 대비 위치 확인</p>
            <p>✓ 제외어로 가공품/비교 부적합 상품 제거</p>
            <p>✓ 구성/중량 대비 가격 비교로 가성비 분석</p>
          </div>
        </aside>
      </div>
    </section>
  );
}