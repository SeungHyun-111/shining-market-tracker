import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(value, mode) {
  const d = parseDate(value);

  if (mode === "month") return `${d.getMonth() + 1}월`;

  if (mode === "week") {
    const week = Math.ceil(d.getDate() / 7);
    return `${d.getMonth() + 1}월 ${week}주`;
  }

  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function average(data, key) {
  if (!data.length) return 0;
  return data.reduce((sum, row) => sum + Number(row[key] || 0), 0) / data.length;
}

function findPeak(data, key) {
  if (!data.length) return "-";

  const peak = data.reduce((max, row) =>
    Number(row[key] || 0) > Number(max[key] || 0) ? row : max
  );

  return formatDate(peak.date, "day");
}

function getMonthKey(date) {
  const d = parseDate(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekRange(date) {
  const d = parseDate(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const toKey = (v) => {
    const yyyy = v.getFullYear();
    const mm = String(v.getMonth() + 1).padStart(2, "0");
    const dd = String(v.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return [toKey(start), toKey(end)];
}

function makeTicks(data, mode) {
  if (mode === "month") {
    return data.filter((row) => row.date.endsWith("-01")).map((row) => row.date);
  }

  if (mode === "week") {
    return data
      .filter((row, index) => {
        const d = parseDate(row.date);
        return index === 0 || d.getDay() === 1;
      })
      .map((row) => row.date);
  }

  return data.map((row) => row.date);
}

export default function YearCompareSection({ selectedKeyword, data }) {
  const wheelAreaRef = useRef(null);

  const [zoomMode, setZoomMode] = useState("month");
  const [hoverDate, setHoverDate] = useState(null);
  const [focusMonth, setFocusMonth] = useState(null);
  const [focusWeekRange, setFocusWeekRange] = useState(null);

  const chartData = useMemo(() => {
    return data.map((row) => ({
      ...row,
      date: row.date || row.label,
    }));
  }, [data]);

  const visibleData = useMemo(() => {
    if (zoomMode === "month") {
      return chartData;
    }

    if (zoomMode === "week") {
      const monthKey = focusMonth || getMonthKey(hoverDate || chartData[0]?.date);
      return chartData.filter((row) => row.date.startsWith(monthKey));
    }

    if (zoomMode === "day") {
      const [start, end] =
        focusWeekRange || getWeekRange(hoverDate || chartData[0]?.date);

      return chartData.filter((row) => row.date >= start && row.date <= end);
    }

    return chartData;
  }, [chartData, zoomMode, focusMonth, focusWeekRange, hoverDate]);

  const ticks = useMemo(() => makeTicks(visibleData, zoomMode), [visibleData, zoomMode]);

  const currentAvg = average(visibleData, "value");
  const lastYearAvg = average(visibleData, "lastYear");

  const growthRate =
    lastYearAvg === 0 ? 0 : ((currentAvg - lastYearAvg) / lastYearAvg) * 100;

  const currentPeak = findPeak(visibleData, "value");
  const lastYearPeak = findPeak(visibleData, "lastYear");

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      const baseDate = hoverDate || visibleData[0]?.date || chartData[0]?.date;
      if (!baseDate) return;

      if (event.deltaY > 0) {
        if (zoomMode === "month") {
          setFocusMonth(getMonthKey(baseDate));
          setZoomMode("week");
        } else if (zoomMode === "week") {
          setFocusWeekRange(getWeekRange(baseDate));
          setZoomMode("day");
        }
      }

      if (event.deltaY < 0) {
        if (zoomMode === "day") {
          setFocusWeekRange(null);
          setZoomMode("week");
        } else if (zoomMode === "week") {
          setFocusMonth(null);
          setZoomMode("month");
        }
      }
    },
    [chartData, hoverDate, visibleData, zoomMode]
  );

  useEffect(() => {
    const el = wheelAreaRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  return (
    <section className="detail-grid">
      <div className="section-card large-chart">
        <div className="section-head">
          <h3>전년 동일 대비 비교 ({selectedKeyword})</h3>
        </div>

        <div ref={wheelAreaRef} className="chart-wheel-area">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={visibleData}
              onMouseMove={(e) => {
                if (e?.activeLabel) setHoverDate(e.activeLabel);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                ticks={ticks}
                tickFormatter={(value) => formatDate(value, zoomMode)}
                minTickGap={20}
              />

              <YAxis />
              <Tooltip labelFormatter={(value) => formatDate(value, "day")} />
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

        <div className="kpi-grid">
          <div>
            <span>올해 평균</span>
            <strong>{currentAvg.toFixed(2)}%</strong>
          </div>
          <div>
            <span>작년 평균</span>
            <strong>{lastYearAvg.toFixed(2)}%</strong>
          </div>
          <div>
            <span>전년 대비</span>
            <strong className={growthRate >= 0 ? "up" : "down"}>
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(1)}%
            </strong>
          </div>
          <div>
            <span>피크 비교</span>
            <strong>
              {currentPeak} / {lastYearPeak}
            </strong>
          </div>
        </div>
      </div>

      <aside className="section-card item-card">
        <h3>선택 아이템 정보</h3>
        <div className="fruit-icon">🍑</div>
        <h2>{selectedKeyword}</h2>
        <span className="badge">선택 아이템</span>

        <dl>
          <div>
            <dt>표시 단위</dt>
            <dd>
              {zoomMode === "month"
                ? "월 단위"
                : zoomMode === "week"
                ? "주차 단위"
                : "일자 단위"}
            </dd>
          </div>
          <div>
            <dt>올해 평균 민감도</dt>
            <dd>{currentAvg.toFixed(2)}%</dd>
          </div>
          <div>
            <dt>작년 평균 민감도</dt>
            <dd>{lastYearAvg.toFixed(2)}%</dd>
          </div>
          <div>
            <dt>전년 대비</dt>
            <dd className={growthRate >= 0 ? "up" : "down"}>
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(1)}%
            </dd>
          </div>
          <div>
            <dt>올해 피크</dt>
            <dd>{currentPeak}</dd>
          </div>
          <div>
            <dt>작년 피크</dt>
            <dd>{lastYearPeak}</dd>
          </div>
        </dl>

        <button className="primary-btn">아이템 비교하기</button>
      </aside>
    </section>
  );
}