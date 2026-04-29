export default function HeaderBar({ period, setPeriod, category, setCategory }) {
  return (
    <header className="header-bar">
      <div>
        <h1>대시보드</h1>
        <p>식품 하위 아이템 민감도 트렌드 및 가격 분석</p>
      </div>

      <div className="header-controls">
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7">최근 7일</option>
          <option value="14">최근 14일</option>
          <option value="21">최근 21일</option>
          <option value="30">최근 30일</option>
        </select>

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">전체</option>
          <option value="과일">과일</option>
          <option value="채소">채소</option>
          <option value="해산물/어패류">해산물/어패류</option>
        </select>

        <button type="button" onClick={() => window.location.reload()}>
          ↻ 데이터 업데이트
        </button>
      </div>
    </header>
  );
}