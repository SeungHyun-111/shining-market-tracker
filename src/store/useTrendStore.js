import { useEffect, useMemo, useState } from "react";
import { fetchTrendData } from "../api/trendApi";
import { fetchPriceData } from "../api/priceApi";

export function useTrendStore() {
  const [period, setPeriod] = useState("7");
  const [category, setCategory] = useState("all");
  const [selectedKeyword, setSelectedKeyword] = useState("복숭아");

  const [top20Data, setTop20Data] = useState([]);
  const [trendMap, setTrendMap] = useState({});
  const [priceItems, setPriceItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const year = 2025;

  useEffect(() => {
    async function loadTrend() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchTrendData({
          year,
          category,
        });

        setTop20Data(data.top20Data || []);
        setTrendMap(data.trendMap || {});

        const firstKeyword = data.top20Data?.[0]?.keyword;
        if (firstKeyword && !data.trendMap?.[selectedKeyword]) {
          setSelectedKeyword(firstKeyword);
        }
      } catch (e) {
        setError(e.message);
        setTop20Data([]);
        setTrendMap({});
      } finally {
        setLoading(false);
      }
    }

    loadTrend();
  }, [category]);

  useEffect(() => {
    async function loadPrice() {
      const data = await fetchPriceData(selectedKeyword);
      setPriceItems(data.items || []);
    }

    if (selectedKeyword) {
      loadPrice();
    }
  }, [selectedKeyword]);

  const filteredTop20 = useMemo(() => {
    if (category === "all") return top20Data;
    return top20Data.filter((item) => item.category === category);
  }, [top20Data, category]);

  const trendData = trendMap[selectedKeyword] || {
    monthly: [],
    weekly: [],
    yearCompare: [],
  };

  return {
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
    error,
  };
}