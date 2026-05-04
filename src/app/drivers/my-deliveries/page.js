"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { Star, Package, TrendingUp, Calendar, Clock, Award } from "lucide-react";

const links = [
  { href: "/drivers/dashboard", label: "Available Jobs" },
  { href: "/drivers/my-deliveries", label: "My History" },
  { href: "/drivers/profile", label: "Profile" },
];

export default function DriverHistoryPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "DRIVER") { router.push("/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [deliveriesRes, profileRes] = await Promise.all([
        api.get("/api/deliveries/my-active"),
        api.get("/api/profile/driver").catch(() => ({ data: null })),
      ]);
      setDeliveries(deliveriesRes.data);
      setProfile(profileRes.data);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const completed = deliveries.filter(d => d.status === "DELIVERED");

  // Period filtering
  const now = new Date();
  const filterByPeriod = (list) => {
    if (period === "all") return list;
    return list.filter(d => {
      const date = new Date(d.deliveredAt || d.createdAt);
      if (period === "today") {
        return date.toDateString() === now.toDateString();
      }
      if (period === "week") {
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }
      if (period === "month") {
        return date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };

  const periodDeliveries = filterByPeriod(completed);
  const periodEarnings = periodDeliveries.reduce((s, d) => s + (d.price || 0), 0);

  // Weekly breakdown
  const getWeeklyBreakdown = () => {
    const weeks = {};
    completed.forEach(d => {
      const date = new Date(d.deliveredAt || d.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      if (!weeks[key]) weeks[key] = { count: 0, earnings: 0 };
      weeks[key].count++;
      weeks[key].earnings += (d.price || 0);
    });
    return Object.entries(weeks)
      .slice(-8)
      .map(([week, data]) => ({ week, ...data }));
  };

  // Monthly breakdown
  const getMonthlyBreakdown = () => {
    const months = {};
    completed.forEach(d => {
      const date = new Date(d.deliveredAt || d.createdAt);
      const key = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      if (!months[key]) months[key] = { count: 0, earnings: 0 };
      months[key].count++;
      months[key].earnings += (d.price || 0);
    });
    return Object.entries(months)
      .slice(-6)
      .map(([month, data]) => ({ month, ...data }));
  };

  const weekly = getWeeklyBreakdown();
  const monthly = getMonthlyBreakdown();
  const maxWeeklyEarnings = Math.max(...weekly.map(w => w.earnings), 1);
  const maxMonthlyEarnings = Math.max(...monthly.map(m => m.earnings), 1);

  const allEarnings = completed.reduce((s, d) => s + (d.price || 0), 0);
  const rated = completed.filter(d => d.rating);
  const avgRating = rated.length > 0
    ? (rated.reduce((s, d) => s + d.rating, 0) / rated.length).toFixed(1)
    : null;

  const todayEarnings = filterByPeriod(completed.filter(() => {
    const d = new Date();
    return d.toDateString() === now.toDateString();
  }));

  const periods = [
    { key: "today", label: "Today" },
    { key: "week",  label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all",   label: "All Time" },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Earnings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track your delivery history and income</p>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {periods.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
                period === p.key
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-100 hover:border-gray-200"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Period stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: `${periods.find(p => p.key === period)?.label} Earnings`,
              value: `${periodEarnings.toLocaleString()} DA`,
              icon: TrendingUp,
              color: "green",
            },
            {
              label: "Deliveries",
              value: periodDeliveries.length,
              icon: Package,
              color: "blue",
            },
            {
              label: "All Time",
              value: `${allEarnings.toLocaleString()} DA`,
              icon: Award,
              color: "purple",
            },
            {
              label: "Avg Rating",
              value: avgRating ? `${avgRating} ⭐` : "—",
              icon: Star,
              color: "yellow",
              sub: `${rated.length} ratings`,
            },
          ].map(s => {
            const Icon = s.icon;
            const colors = {
              green:  { bg: "bg-green-50",  text: "text-green-600",  val: "text-green-700" },
              blue:   { bg: "bg-blue-50",   text: "text-blue-600",   val: "text-blue-700" },
              purple: { bg: "bg-purple-50", text: "text-purple-600", val: "text-purple-700" },
              yellow: { bg: "bg-yellow-50", text: "text-yellow-600", val: "text-yellow-700" },
            };
            const c = colors[s.color];
            return (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <p className={`text-xl md:text-2xl font-bold ${c.val}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                {s.sub && <p className="text-xs text-gray-400">{s.sub}</p>}
              </div>
            );
          })}
        </div>

        {/* Weekly chart */}
        {weekly.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-800 text-sm">Weekly Earnings</h2>
            </div>
            <div className="flex items-end gap-2 h-32">
              {weekly.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <p className="text-xs text-gray-500 font-medium hidden sm:block truncate w-full text-center">
                    {w.earnings > 0 ? `${w.earnings}` : ""}
                  </p>
                  <div className="w-full bg-gray-100 rounded-lg overflow-hidden relative"
                    style={{ height: "80px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-green-500 rounded-lg transition-all duration-500"
                      style={{ height: `${(w.earnings / maxWeeklyEarnings) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 truncate w-full text-center">{w.week}</p>
                  <p className="text-xs text-green-600 font-medium">{w.count}x</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly chart */}
        {monthly.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <h2 className="font-semibold text-gray-800 text-sm">Monthly Earnings</h2>
            </div>
            <div className="space-y-3">
              {monthly.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <p className="text-xs text-gray-500 w-24 flex-shrink-0">{m.month}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                    <div
                      className="absolute left-0 top-0 h-full bg-purple-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((m.earnings / maxMonthlyEarnings) * 100, 5)}%` }}>
                      <span className="text-xs text-white font-medium whitespace-nowrap">
                        {m.earnings > 0 ? `${m.earnings} DA` : ""}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 w-8 text-right flex-shrink-0">{m.count}x</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery history list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              {period === "all" ? "All Deliveries" : `${periods.find(p => p.key === period)?.label} Deliveries`}
            </h2>
            <span className="text-xs text-gray-400">{periodDeliveries.length} total</span>
          </div>

          {periodDeliveries.length === 0 ? (
            <div className="p-10 text-center">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No deliveries in this period</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {periodDeliveries.map((d) => (
                <div key={d.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-gray-800 text-sm">{d.itemDescription}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        🏪 {d.businessName} → 📍 {d.dropoffAddress}
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {d.deliveredAt
                          ? new Date(d.deliveredAt).toLocaleString()
                          : new Date(d.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-600 text-sm">{d.price} DA</p>
                      {d.rating ? (
                        <div className="flex items-center gap-0.5 justify-end mt-1">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={`text-xs ${s <= d.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 mt-1">No rating</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {completed.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 mt-4">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No completed deliveries yet</p>
            <p className="text-gray-300 text-sm mt-1">Complete deliveries to see your earnings here</p>
          </div>
        )}
      </div>
    </div>
  );
}