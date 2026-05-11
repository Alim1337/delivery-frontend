"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import {
  TrendingUp, Package, CheckCircle, XCircle,
  Clock, Star, DollarSign, BarChart3,
  Truck, Calendar, ArrowUp, ArrowDown, RefreshCw
} from "lucide-react";

const links = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/new-delivery", label: "New Delivery" },
  { href: "/business/analytics", label: "Analytics" },
  { href: "/business/profile", label: "Profile" },
];

export default function BusinessAnalyticsPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeliveries = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get("/api/deliveries/my-business");
      setDeliveries(res.data);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "BUSINESS") { router.push("/login"); return; }
    fetchDeliveries();
  }, []);

  // ── PERIOD FILTERING ──────────────────────────────────────────────────────

  const now = new Date();

  const filterByPeriod = (list, p = period) => {
    return list.filter(d => {
      const date = new Date(d.createdAt);
      if (p === "week") {
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }
      if (p === "month") {
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
      }
      if (p === "quarter") {
        const quarter = Math.floor(now.getMonth() / 3);
        const dQuarter = Math.floor(date.getMonth() / 3);
        return dQuarter === quarter && date.getFullYear() === now.getFullYear();
      }
      return true; // all
    });
  };

  const current = filterByPeriod(deliveries);
  const previous = filterByPeriod(deliveries, period === "month"
    ? "prevMonth" : period === "week" ? "prevWeek" : period);

  const filterPrevious = (list) => {
    return list.filter(d => {
      const date = new Date(d.createdAt);
      if (period === "week") {
        const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      }
      if (period === "month") {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === prevMonth.getMonth() &&
               date.getFullYear() === prevMonth.getFullYear();
      }
      return false;
    });
  };

  const prev = filterPrevious(deliveries);

  // ── COMPUTED STATS ────────────────────────────────────────────────────────

  const stats = {
    total: current.length,
    delivered: current.filter(d => d.status === "DELIVERED").length,
    cancelled: current.filter(d => d.status === "CANCELLED").length,
    active: current.filter(d => !["DELIVERED", "CANCELLED"].includes(d.status)).length,
    revenue: current.filter(d => d.status === "DELIVERED")
      .reduce((s, d) => s + (d.price || 0), 0),
    avgPrice: current.length > 0
      ? Math.round(current.reduce((s, d) => s + (d.price || 0), 0) / current.length)
      : 0,
    completionRate: current.length > 0
      ? Math.round((current.filter(d => d.status === "DELIVERED").length / current.length) * 100)
      : 0,
    avgRating: (() => {
      const rated = current.filter(d => d.rating);
      return rated.length > 0
        ? (rated.reduce((s, d) => s + d.rating, 0) / rated.length).toFixed(1)
        : null;
    })(),
  };

  const prevStats = {
    total: prev.length,
    revenue: prev.filter(d => d.status === "DELIVERED")
      .reduce((s, d) => s + (d.price || 0), 0),
  };

  const trend = (curr, p) => {
    if (p === 0) return null;
    const pct = Math.round(((curr - p) / p) * 100);
    return pct;
  };

  const deliveryTrend = trend(stats.total, prevStats.total);
  const revenueTrend = trend(stats.revenue, prevStats.revenue);

  // ── CHART DATA ────────────────────────────────────────────────────────────

  const getDailyData = () => {
    const days = {};
    const daysCount = period === "week" ? 7 : period === "month" ? 30 : 90;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      days[key] = { count: 0, revenue: 0, delivered: 0 };
    }
    current.forEach(d => {
      const date = new Date(d.createdAt);
      const key = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      if (days[key]) {
        days[key].count++;
        if (d.status === "DELIVERED") {
          days[key].delivered++;
          days[key].revenue += (d.price || 0);
        }
      }
    });
    return Object.entries(days).map(([date, data]) => ({ date, ...data }));
  };

  const getDriverStats = () => {
    const map = {};
    current.filter(d => d.driverName).forEach(d => {
      if (!map[d.driverName]) map[d.driverName] = { name: d.driverName, count: 0, delivered: 0, ratings: [] };
      map[d.driverName].count++;
      if (d.status === "DELIVERED") map[d.driverName].delivered++;
      if (d.rating) map[d.driverName].ratings.push(d.rating);
    });
    return Object.values(map)
      .map(d => ({
        ...d,
        avgRating: d.ratings.length > 0
          ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1)
          : null,
        rate: d.count > 0 ? Math.round((d.delivered / d.count) * 100) : 0,
      }))
      .sort((a, b) => b.delivered - a.delivered);
  };

  const getStatusBreakdown = () => {
    const statuses = ["PENDING", "ACCEPTED", "PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED"];
    return statuses.map(s => ({
      status: s,
      count: current.filter(d => d.status === s).length,
      pct: current.length > 0
        ? Math.round((current.filter(d => d.status === s).length / current.length) * 100)
        : 0,
    })).filter(s => s.count > 0);
  };

  const daily = getDailyData();
  const driverStats = getDriverStats();
  const statusBreakdown = getStatusBreakdown();

  const maxCount = Math.max(...daily.map(d => d.count), 1);
  const maxRevenue = Math.max(...daily.map(d => d.revenue), 1);

  // Show every Nth label to avoid crowding
  const labelStep = period === "week" ? 1 : period === "month" ? 5 : 10;

  const statusColors = {
    PENDING:    "bg-yellow-400",
    ACCEPTED:   "bg-blue-400",
    PICKED_UP:  "bg-indigo-400",
    ON_THE_WAY: "bg-purple-400",
    DELIVERED:  "bg-green-400",
    CANCELLED:  "bg-red-400",
  };

  const periods = [
    { key: "week",    label: "Last 7 days" },
    { key: "month",   label: "This month" },
    { key: "quarter", label: "This quarter" },
    { key: "all",     label: "All time" },
  ];

  const TrendBadge = ({ value }) => {
    if (value === null) return null;
    const up = value >= 0;
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${
        up ? "text-green-600" : "text-red-500"
      }`}>
        {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {Math.abs(value)}%
      </span>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar links={links} />
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar links={links} />
      <div className="max-w-6xl mx-auto p-4 md:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              Analytics
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Track your business performance</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchDeliveries(true)} disabled={refreshing}
              className="flex items-center gap-2 text-sm text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
                period === p.key
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:border-gray-200"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {deliveries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center border border-gray-100 dark:border-gray-700">
            <BarChart3 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-lg">No data yet</p>
            <p className="text-gray-300 text-sm mt-1">Create deliveries to see analytics</p>
            <button onClick={() => router.push("/business/new-delivery")}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
              + New Delivery
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Total Deliveries",
                  value: stats.total,
                  icon: Package,
                  color: "blue",
                  trend: deliveryTrend,
                  sub: `${stats.active} active`,
                },
                {
                  label: "Revenue",
                  value: `${stats.revenue.toLocaleString()} DA`,
                  icon: DollarSign,
                  color: "green",
                  trend: revenueTrend,
                  sub: `avg ${stats.avgPrice} DA`,
                },
                {
                  label: "Completion Rate",
                  value: `${stats.completionRate}%`,
                  icon: CheckCircle,
                  color: "purple",
                  sub: `${stats.delivered} delivered`,
                },
                {
                  label: "Avg Rating",
                  value: stats.avgRating ? `${stats.avgRating} ⭐` : "—",
                  icon: Star,
                  color: "yellow",
                  sub: `${current.filter(d => d.rating).length} ratings`,
                },
              ].map(card => {
                const Icon = card.icon;
                const colors = {
                  blue:   { bg: "bg-blue-50 dark:bg-blue-900/30",   text: "text-blue-600 dark:text-blue-400",   val: "text-blue-700 dark:text-blue-300" },
                  green:  { bg: "bg-green-50 dark:bg-green-900/30",  text: "text-green-600 dark:text-green-400",  val: "text-green-700 dark:text-green-300" },
                  purple: { bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", val: "text-purple-700 dark:text-purple-300" },
                  yellow: { bg: "bg-yellow-50 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", val: "text-yellow-700 dark:text-yellow-300" },
                };
                const c = colors[card.color];
                return (
                  <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
                        <Icon className={`w-4 h-4 ${c.text}`} />
                      </div>
                      {card.trend !== undefined && <TrendBadge value={card.trend} />}
                    </div>
                    <p className={`text-xl md:text-2xl font-bold ${c.val}`}>{card.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.label}</p>
                    {card.sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>}
                  </div>
                );
              })}
            </div>

            {/* Deliveries over time chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Deliveries Over Time
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" />
                    Total
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
                    Delivered
                  </span>
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-1 h-40 overflow-x-auto pb-6 relative">
                {daily.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0 group"
                    style={{ minWidth: period === "all" ? "12px" : period === "quarter" ? "14px" : "20px" }}>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap -translate-x-1/2 left-1/2">
                      <p className="font-medium">{d.date}</p>
                      <p>{d.count} deliveries</p>
                      {d.revenue > 0 && <p>{d.revenue} DA</p>}
                    </div>

                    {/* Bars */}
                    <div className="relative flex items-end gap-0.5 h-32">
                      {/* Total bar */}
                      <div
                        className="bg-purple-200 dark:bg-purple-900 rounded-t transition-all duration-300 hover:bg-purple-300 w-2.5"
                        style={{ height: `${Math.max((d.count / maxCount) * 100, d.count > 0 ? 4 : 0)}%` }}
                        title={`${d.count} total`}
                      />
                      {/* Delivered bar */}
                      <div
                        className="bg-green-400 dark:bg-green-600 rounded-t transition-all duration-300 hover:bg-green-500 w-2.5"
                        style={{ height: `${Math.max((d.delivered / maxCount) * 100, d.delivered > 0 ? 4 : 0)}%` }}
                        title={`${d.delivered} delivered`}
                      />
                    </div>

                    {/* X label */}
                    {i % labelStep === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 -rotate-45 origin-top-left mt-1 whitespace-nowrap"
                        style={{ fontSize: "9px" }}>
                        {d.date}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Revenue Over Time
              </h2>
              <div className="flex items-end gap-1 h-32 overflow-x-auto pb-6">
                {daily.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0 group relative"
                    style={{ minWidth: period === "all" ? "12px" : period === "quarter" ? "14px" : "20px" }}>
                    <div className="absolute bottom-full mb-1 bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap -translate-x-1/2 left-1/2">
                      <p className="font-medium">{d.date}</p>
                      <p>{d.revenue} DA</p>
                    </div>
                    <div className="relative h-28 flex items-end">
                      <div
                        className="bg-green-400 dark:bg-green-600 rounded-t transition-all duration-300 hover:bg-green-500 w-5"
                        style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, d.revenue > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    {i % labelStep === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 -rotate-45 origin-top-left mt-1 whitespace-nowrap"
                        style={{ fontSize: "9px" }}>
                        {d.date}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Status breakdown + Driver performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Status breakdown */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Status Breakdown
                </h2>
                {statusBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No data</p>
                ) : (
                  <div className="space-y-3">
                    {statusBreakdown.map(s => (
                      <div key={s.status}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={s.status} />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {s.count} ({s.pct}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${statusColors[s.status] || "bg-gray-400"}`}
                            style={{ width: `${s.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Driver performance */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                  <Truck className="w-4 h-4 text-green-600" />
                  Driver Performance
                </h2>
                {driverStats.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No assigned drivers yet</p>
                ) : (
                  <div className="space-y-3">
                    {driverStats.slice(0, 5).map((d, i) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i === 0 ? "bg-yellow-100 text-yellow-700" :
                          i === 1 ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" :
                          i === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{d.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-400 rounded-full"
                                style={{ width: `${d.rate}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">{d.rate}%</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-800 dark:text-white">{d.delivered}</p>
                          {d.avgRating && (
                            <p className="text-xs text-yellow-500">⭐ {d.avgRating}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent deliveries */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  Recent Deliveries
                  <span className="text-xs text-gray-400 font-normal">({current.length})</span>
                </h2>
                <button onClick={() => router.push("/business/dashboard")}
                  className="text-xs text-purple-600 hover:underline">
                  View all →
                </button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {current.slice(0, 6).map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{d.itemDescription}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        👤 {d.customerName || d.recipientName || "—"}
                        {d.driverName ? ` · 🚗 ${d.driverName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">
                        {d.price} DA
                      </span>
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                ))}
                {current.length === 0 && (
                  <p className="p-8 text-center text-gray-400 text-sm">No deliveries in this period</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}