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
        <h2>최근 민감도 TOP20</h2>

        <div className="period-buttons">
          {["7", "14", "30", "90"].map((p) => (
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
          <th>아이템</th>
          <th>카테고리</th>
          <th>민감도</th>
          <th>변동</th>
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
            <td>{item.sensitivity}</td>
            <td className={item.change >= 0 ? "up" : "down"}>
              {item.change > 0 ? "+" : ""}
              {item.change}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}