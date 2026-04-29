import { useEffect, useMemo, useState } from "react";
import { fetchTrendData } from "../api/trendApi";
import { fetchPriceData } from "../api/priceApi";

export function useTrendStore() {
  const [period, setPeriod] = useState("7");
  const [category, setCategory] = useState("all");
  const [selectedKeyword, setSelectedKeyword] = useState("");

  const [top20Data, setTop20Data] = useState([]);
  const [trendMap, setTrendMap] = useState({});
  const [priceItems, setPriceItems] = useState([]);
  const [priceSummary, setPriceSummary] = useState({
    minPrice: 0,
    maxPrice: 0,
    avgPrice: 0,
    count: 0,
  });

  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState(null);
  const [priceError, setPriceError] = useState(null);

  const year = new Date().getFullYear();

  useEffect(() => {
    async function loadTrend() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchTrendData({
          year,
          category,
          period,
        });

        const nextTop20 = data.top20Data || [];
        const nextTrendMap = data.trendMap || {};

        setTop20Data(nextTop20);
        setTrendMap(nextTrendMap);

        const firstKeyword = nextTop20[0]?.keyword || "";
        setSelectedKeyword((prev) => {
          if (prev && nextTrendMap[prev]) return prev;
          return firstKeyword;
        });
      } catch (e) {
        setError(e.message);
        setTop20Data([]);
        setTrendMap({});
        setSelectedKeyword("");
      } finally {
        setLoading(false);
      }
    }

    loadTrend();
  }, [category, period]);

  useEffect(() => {
    async function loadPrice() {
      if (!selectedKeyword) {
        setPriceItems([]);
        setPriceSummary({
          minPrice: 0,
          maxPrice: 0,
          avgPrice: 0,
          count: 0,
        });
        return;
      }

      try {
        setPriceLoading(true);
        setPriceError(null);

        const data = await fetchPriceData(selectedKeyword);

        setPriceItems(data.items || []);
        setPriceSummary(
          data.summary || {
            minPrice: 0,
            maxPrice: 0,
            avgPrice: 0,
            count: 0,
          }
        );
      } catch (e) {
        setPriceError(e.message);
        setPriceItems([]);
        setPriceSummary({
          minPrice: 0,
          maxPrice: 0,
          avgPrice: 0,
          count: 0,
        });
      } finally {
        setPriceLoading(false);
      }
    }

    loadPrice();
  }, [selectedKeyword]);

  const filteredTop20 = useMemo(() => {
    if (category === "all") return top20Data;
    return top20Data.filter((item) => item.category === category);
  }, [top20Data, category]);

  const trendData = selectedKeyword
    ? trendMap[selectedKeyword] || {
        monthly: [],
        weekly: [],
        yearCompare: [],
      }
    : {
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
    priceSummary,
    loading,
    priceLoading,
    error,
    priceError,
  };
}