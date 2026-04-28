export default function PriceSection({ selectedKeyword, items }) {
  if (!items.length) return null;

  const prices = items.map((i) => i.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  return (
    <section className="price-grid">
      <div className="section-card">
        <h2>{selectedKeyword} 가격 현황</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>상품명</th>
              <th>판매처</th>
              <th>가격</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{item.title}</td>
                <td>{item.mall}</td>
                <td>{item.price.toLocaleString()}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside className="section-card">
        <h3>가격 요약</h3>
        <p>최저가: {min.toLocaleString()}원</p>
        <p>최고가: {max.toLocaleString()}원</p>
        <p>평균가: {avg.toLocaleString()}원</p>
      </aside>
    </section>
  );
}