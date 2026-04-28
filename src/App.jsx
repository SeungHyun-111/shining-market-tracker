import DashboardLayout from "./layouts/DashboardLayout";
import HeaderBar from "./components/HeaderBar";
import Top20Section from "./components/Top20Section";
import TrendSection from "./components/TrendSection";
import YearCompareSection from "./components/YearCompareSection";
import PriceSection from "./components/PriceSection";
import { useTrendStore } from "./store/useTrendStore";

function App() {
  const {
    period,
    setPeriod,
    category,
    setCategory,
    selectedKeyword,
    setSelectedKeyword,
    filteredTop20,
    trendData,
    priceItems,
    loading,
  } = useTrendStore();

  return (
    <DashboardLayout>
      <HeaderBar
        period={period}
        setPeriod={setPeriod}
        category={category}
        setCategory={setCategory}
      />

      {loading && (
        <div className="section-card">
          데이터를 불러오는 중입니다.
        </div>
      )}

      <Top20Section
        period={period}
        setPeriod={setPeriod}
        data={filteredTop20}
        selectedKeyword={selectedKeyword}
        onSelect={setSelectedKeyword}
      />

      <TrendSection
        selectedKeyword={selectedKeyword}
        monthlyData={trendData.monthly}
        weeklyData={trendData.weekly}
      />

      <YearCompareSection
        selectedKeyword={selectedKeyword}
        data={trendData.yearCompare}
      />

      <PriceSection
        selectedKeyword={selectedKeyword}
        items={priceItems}
      />
    </DashboardLayout>
  );
}

export default App;