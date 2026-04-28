import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function TrendSection({
  selectedKeyword,
  monthlyData,
  weeklyData,
}) {
  return (
    <section className="trend-section">
      <div className="section-title-row">
        <h2>2. 민감도 추이 분석</h2>
        <p className="footnote">본 데이터는 검색량이 아닌 상대값입니다.</p>
      </div>

      <div className="chart-grid">
        <ChartCard
          title={`월별 민감도 추이 (${selectedKeyword})`}
          data={monthlyData}
        />

        <ChartCard
          title={`주차별 민감도 추이 (${selectedKeyword})`}
          data={weeklyData}
        />
      </div>
    </section>
  );
}

function ChartCard({ title, data }) {
  return (
    <div className="section-card chart-card">
      <h3>{title}</h3>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="label"
            interval={0}
            minTickGap={8}
          />

          <YAxis />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="value"
            name="올해"
            stroke="#16a34a"
            strokeWidth={3}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="lastYear"
            name="작년"
            stroke="#94a3b8"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}