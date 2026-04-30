"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { Package, Star, RefreshCw, ExternalLink } from "lucide-react";

const statusSteps = ["PENDING", "ACCEPTED", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];

export default function CustomerDashboard() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState({});
  const [refreshing, setRefreshing] = useState(false);

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
    const interval = setInterval(() => fetchDeliveries(true), 30000);
    return () => clearInterval(interval);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={[]} />
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Deliveries</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track your incoming orders</p>
          </div>
          <button onClick={() => fetchDeliveries(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-xl transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading your deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 md:p-16 text-center border border-gray-100">
            <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-lg">No deliveries yet</p>
            <p className="text-gray-300 text-sm mt-1">
              When a business sends you something, it will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active */}
            {active.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Active ({active.length})
                </h2>
                <div className="space-y-4">
                  {active.map((d) => {
                    const step = statusSteps.indexOf(d.status);
                    return (
                      <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="font-semibold text-gray-800">{d.itemDescription}</p>
                            <p className="text-sm text-gray-500 mt-0.5">From: {d.businessName}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusBadge status={d.status} />
                            {d.trackingCode && (
                              <a href={`/track/${d.trackingCode}`} target="_blank"
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="relative h-2 bg-gray-100 rounded-full mb-2">
                            <div
                              className="absolute h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{
                                width: step >= 0
                                  ? `${(step / (statusSteps.length - 1)) * 100}%`
                                  : "0%"
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-300">
                            <span>Placed</span>
                            <span>Accepted</span>
                            <span>Picked up</span>
                            <span>On way</span>
                            <span>Done</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Driver</p>
                            <p className="font-medium text-gray-700 text-sm">
                              {d.driverName || "Waiting for driver..."}
                            </p>
                            {d.driverPhone && (
                              <p className="text-xs text-gray-400 mt-0.5">{d.driverPhone}</p>
                            )}
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 mb-0.5">Deliver to</p>
                            <p className="font-medium text-gray-700 text-sm">{d.dropoffAddress}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Completed ({completed.length})
                </h2>
                <div className="space-y-3">
                  {completed.map((d) => (
                    <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-medium text-gray-800">{d.itemDescription}</p>
                          <p className="text-sm text-gray-400 mt-0.5">
                            {d.businessName} • {d.deliveredAt
                              ? new Date(d.deliveredAt).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      {!d.rating && !rating[d.id] && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <p className="text-sm text-gray-500 mb-2">How was your delivery?</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onClick={() => handleRate(d.id, star)}
                                className="text-2xl transition hover:scale-110 active:scale-95">
                                <span className={star <= (rating[d.id] || 0) ? "text-yellow-400" : "text-gray-200"}>
                                  ★
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {(d.rating || rating[d.id]) && (
                        <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          You rated this {d.rating || rating[d.id]}/5
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled */}
            {cancelled.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Cancelled ({cancelled.length})
                </h2>
                <div className="space-y-3">
                  {cancelled.map((d) => (
                    <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 opacity-60">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-700 text-sm">{d.itemDescription}</p>
                        <StatusBadge status={d.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-gray-300 text-xs mt-8">
          Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  );
}