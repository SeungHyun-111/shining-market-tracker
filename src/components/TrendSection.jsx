import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function TrendSection({
  selectedKeyword,
  monthlyData = [],
  weeklyData = [],
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
          type="monthly"
        />

        <ChartCard
          title={`주차별 민감도 추이 (${selectedKeyword})`}
          data={weeklyData}
          type="weekly"
          scroll
        />
      </div>
    </section>
  );
}

function ChartCard({ title, data = [], type, scroll = false }) {
  const boxRef = useRef(null);
  const [boxWidth, setBoxWidth] = useState(520);

  const isWeekly = type === "weekly";
  const chartHeight = 300;

  useEffect(() => {
    if (!boxRef.current) return;

    const updateWidth = () => {
      const width = boxRef.current?.clientWidth || 520;
      setBoxWidth(width);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(boxRef.current);

    return () => observer.disconnect();
  }, []);

  const chartWidth = scroll
    ? Math.max(1200, data.length * 40, boxWidth)
    : Math.max(320, boxWidth);

  return (
    <div className="section-card chart-card" ref={boxRef}>
      <h3>{title}</h3>

      <div className={scroll ? "chart-scroll" : "chart-static"}>
        <LineChart
          width={chartWidth}
          height={chartHeight}
          data={data}
          margin={{
            top: 10,
            right: 24,
            left: 0,
            bottom: isWeekly ? 62 : 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

          <XAxis
            dataKey="label"
            interval={0}
            angle={isWeekly ? -90 : 0}
            textAnchor={isWeekly ? "end" : "middle"}
            height={isWeekly ? 82 : 36}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />

          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />

          <Tooltip />
          <Legend verticalAlign="bottom" height={28} />

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
      </div>
    </div>
  );
}