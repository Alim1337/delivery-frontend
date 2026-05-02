"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import {
  Package, Star, RefreshCw, ExternalLink,
  Truck, Building2, MapPin, Clock
} from "lucide-react";

const links = [
  { href: "/customers/dashboard", label: "My Deliveries" },
  { href: "/customers/profile", label: "Profile" },
];

const statusSteps = ["PENDING", "ACCEPTED", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];

const statusInfo = {
  PENDING:    { label: "Waiting for driver",  color: "bg-yellow-50 border-yellow-200 text-yellow-700",  icon: Clock },
  ACCEPTED:   { label: "Driver assigned",     color: "bg-blue-50 border-blue-200 text-blue-700",        icon: Truck },
  PICKED_UP:  { label: "Package picked up",   color: "bg-indigo-50 border-indigo-200 text-indigo-700",  icon: Package },
  ON_THE_WAY: { label: "On the way! 🚗",      color: "bg-purple-50 border-purple-200 text-purple-700",  icon: Truck },
  DELIVERED:  { label: "Delivered ✅",         color: "bg-green-50 border-green-200 text-green-700",     icon: Package },
  CANCELLED:  { label: "Cancelled",            color: "bg-red-50 border-red-200 text-red-700",           icon: Package },
};

export default function CustomerDashboard() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rating, setRating] = useState({});
  const [tab, setTab] = useState("active");
  const intervalRef = useRef(null);

  const fetchDeliveries = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get("/api/deliveries/my-deliveries");
      setDeliveries(res.data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "CUSTOMER") { router.push("/login"); return; }
    fetchDeliveries();
    intervalRef.current = setInterval(() => fetchDeliveries(true), 45000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleRate = async (deliveryId, stars) => {
    try {
      await api.post(`/api/deliveries/${deliveryId}/rate`, { rating: stars });
      toast.success("Thanks for rating! ⭐");
      setRating(prev => ({ ...prev, [deliveryId]: stars }));
      fetchDeliveries(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to rate");
    }
  };

  const active = deliveries.filter(d => !["DELIVERED", "CANCELLED"].includes(d.status));
  const completed = deliveries.filter(d => d.status === "DELIVERED");
  const cancelled = deliveries.filter(d => d.status === "CANCELLED");
  const tabData = { active, completed, cancelled };
  const current = tabData[tab] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-4xl mx-auto p-4 md:p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Deliveries</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track all your incoming orders</p>
          </div>
          <button onClick={() => fetchDeliveries(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl transition disabled:opacity-50 hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>

        {/* Tabs */}
        {!loading && deliveries.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { key: "active", label: "Active", count: active.length },
              { key: "completed", label: "Done", count: completed.length },
              { key: "cancelled", label: "Cancelled", count: cancelled.length },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`p-3 rounded-xl border-2 transition text-center ${
                  tab === t.key
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}>
                <p className={`text-xl font-bold ${tab === t.key ? "text-blue-600" : "text-gray-800"}`}>
                  {t.count}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Loading your deliveries...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-lg">No deliveries yet</p>
            <p className="text-gray-300 text-sm mt-1">When a business sends you something, it appears here</p>
          </div>
        ) : current.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No {tab} deliveries</p>
          </div>
        ) : (
          <div className="space-y-4">
            {current.map((d) => {
              const step = statusSteps.indexOf(d.status);
              const info = statusInfo[d.status] || {};
              const StatusIcon = info.icon || Package;
              const isActive = !["DELIVERED", "CANCELLED"].includes(d.status);
              const isDelivered = d.status === "DELIVERED";

              return (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Status banner */}
                  <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${info.color}`}>
                    <StatusIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold flex-1">{info.label}</span>
                    {d.status === "ON_THE_WAY" && (
                      <span className="text-xs font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>

                  <div className="p-4 md:p-5">
                    {/* Top */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-semibold text-gray-800">{d.itemDescription}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          #{d.id} · {new Date(d.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {d.trackingCode && (
                        <a href={`/track/${d.trackingCode}`} target="_blank"
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg font-medium flex-shrink-0">
                          <ExternalLink className="w-3 h-3" />
                          Track
                        </a>
                      )}
                    </div>

                    {/* Progress */}
                    {isActive && (
                      <div className="mb-4">
                        <div className="relative h-1.5 bg-gray-100 rounded-full mb-2">
                          <div className="absolute h-full bg-blue-600 rounded-full transition-all duration-700"
                            style={{ width: step >= 0 ? `${(step / (statusSteps.length - 1)) * 100}%` : "0%" }} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-300">
                          <span>Placed</span><span>Accepted</span>
                          <span>Picked up</span><span>On way</span><span>Done</span>
                        </div>
                      </div>
                    )}

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center gap-2.5 p-3 bg-purple-50 rounded-xl">
                        <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-purple-400">Sent by</p>
                          <p className="text-sm font-medium text-purple-800 truncate">{d.businessName}</p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2.5 p-3 rounded-xl ${d.driverName ? "bg-green-50" : "bg-gray-50"}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${d.driverName ? "bg-green-100" : "bg-gray-100"}`}>
                          <Truck className={`w-3.5 h-3.5 ${d.driverName ? "text-green-600" : "text-gray-400"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs ${d.driverName ? "text-green-400" : "text-gray-400"}`}>Driver</p>
                          <p className={`text-sm font-medium truncate ${d.driverName ? "text-green-800" : "text-gray-400 italic"}`}>
                            {d.driverName || "Waiting for driver..."}
                          </p>
                          {d.driverPhone && <p className="text-xs text-green-500">{d.driverPhone}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">Delivering to</p>
                          <p className="text-sm font-medium text-gray-700 truncate">{d.dropoffAddress}</p>
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    {isDelivered && !d.rating && !rating[d.id] && (
                      <div className="mt-4 pt-4 border-t border-gray-50">
                        <p className="text-sm text-gray-500 mb-2 font-medium">How was your delivery?</p>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => handleRate(d.id, star)}
                              className="text-2xl transition-transform hover:scale-125 active:scale-95">
                              <span className={star <= (rating[d.id] || 0) ? "text-yellow-400" : "text-gray-200"}>★</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isDelivered && (d.rating || rating[d.id]) && (
                      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-lg ${s <= (d.rating || rating[d.id]) ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                        ))}
                        <span className="text-xs text-gray-400 ml-1">You rated {d.rating || rating[d.id]}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && deliveries.length > 0 && (
          <p className="text-center text-gray-300 text-xs mt-6 pb-2">
            🔄 Auto-refreshes every 45 seconds
          </p>
        )}
      </div>
    </div>
  );
}