const menus = ["대시보드"];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">☘</div>
        <div>
          <strong>농산물 트렌드 분석</strong>
          <span>소분류 민감도 기반</span>
        </div>
      </div>

      <nav className="menu">
        {menus.map((menu, index) => (
          <button key={menu} className={index === 0 ? "active" : ""}>
            {menu}
          </button>
        ))}
      </nav>

      <div className="guide-box">
        <strong>TOP20 선정 로직</strong>

        <p>
          상품 후보군은 네이버 쇼핑 카테고리의
          <b> 소분류(category3)</b> 기준으로 구성합니다.
        </p>

        <p>
          선택한 기간 안에서 민감도가 높은 상품을 우선 반영하고,
          최근 상승 흐름을 보조 점수로 반영합니다.
        </p>

        <div className="formula-box">
          <b>최종점수</b>
          <span>선택기간 평균 민감도 70%</span>
          <span>+ 최근 기울기 점수 30%</span>
        </div>

        <div className="formula-box">
          <b>기울기 점수</b>
          <span>최근 7일 기울기 50%</span>
          <span>+ 최근 14일 기울기 30%</span>
          <span>+ 최근 21일 기울기 20%</span>
        </div>

        <p>업데이트: 매일 03:00</p>
      </div>
    </aside>
  );
}