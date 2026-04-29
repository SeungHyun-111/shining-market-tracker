export default function Top20Section({
  period,
  setPeriod,
  data,
  selectedKeyword,
  onSelect,
}) {
  const left = data.slice(0, 10);
  const right = data.slice(10, 20);

  return (
    <section className="section-card">
      <div className="section-head">
        <div>
          <h2>민감도 TOP20</h2>
          <p className="section-desc">
            선택 기간 평균 민감도와 최근 기울기를 반영한 순위입니다.
          </p>
        </div>

        <div className="period-buttons">
          {["7", "14", "21", "30", "90"].map((p) => (
            <button
              key={p}
              className={period === p ? "active" : ""}
              onClick={() => setPeriod(p)}
            >
              최근 {p}일
            </button>
          ))}
        </div>
      </div>

      <div className="top20-grid">
        <Table data={left} selectedKeyword={selectedKeyword} onSelect={onSelect} />
        <Table data={right} selectedKeyword={selectedKeyword} onSelect={onSelect} />
      </div>
    </section>
  );
}

function Table({ data, selectedKeyword, onSelect }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>순위</th>
          <th>소분류</th>
          <th>카테고리</th>
          <th>평균</th>
          <th>기울기</th>
          <th>점수</th>
        </tr>
      </thead>

      <tbody>
        {data.map((item) => (
          <tr
            key={item.rank}
            className={selectedKeyword === item.keyword ? "selected-row" : ""}
            onClick={() => onSelect(item.keyword)}
          >
            <td>{item.rank}</td>
            <td>{item.keyword}</td>
            <td>{item.category}</td>
            <td>{item.avgSensitivity}</td>
            <td className={item.slopeScore >= 0 ? "up" : "down"}>
              {item.slopeScore > 0 ? "+" : ""}
              {item.slopeScore}
            </td>
            <td>
              <b>{item.score}</b>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}