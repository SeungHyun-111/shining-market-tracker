const menus = [
  "대시보드"
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">☘</div>
        <div>
          <strong>농산물 트렌드 분석</strong>
          <span>상대 민감도 기반</span>
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
        <strong>데이터 안내</strong>
        <p>상대 민감도는 검색 관심도 기준입니다.</p>
        <p>업데이트: 매일 03:00</p>
        <p>가격 정보는 상위 노출 상품 기준입니다.</p>
      </div>
    </aside>
  );
}