"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { Package, Star, RefreshCw } from "lucide-react";

export default function CustomerDashboard() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState({});

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await api.get("/api/deliveries/my-deliveries");
      setDeliveries(res.data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "CUSTOMER") { router.push("/login"); return; }
    fetchDeliveries();
    // auto-refresh every 30 seconds
    const interval = setInterval(fetchDeliveries, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRate = async (deliveryId, stars) => {
    try {
      await api.post(`/api/deliveries/${deliveryId}/rate`, { rating: stars });
      toast.success("Thanks for rating!");
      setRating({ ...rating, [deliveryId]: stars });
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to rate");
    }
  };

  const active = deliveries.filter(d => !["DELIVERED", "CANCELLED"].includes(d.status));
  const completed = deliveries.filter(d => d.status === "DELIVERED");

  const statusSteps = ["PENDING", "ACCEPTED", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={[]} />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Deliveries</h1>
            <p className="text-gray-500 text-sm mt-1">Track your incoming orders</p>
          </div>
          <button onClick={fetchDeliveries}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-xl transition">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading your deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-lg">No deliveries yet</p>
            <p className="text-gray-300 text-sm mt-1">When a business sends you something, it will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active deliveries */}
            {active.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Active ({active.length})
                </h2>
                <div className="space-y-4">
                  {active.map((d) => {
                    const step = statusSteps.indexOf(d.status);
                    return (
                      <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-xs text-gray-400 font-mono">#{d.id}</span>
                            <p className="font-semibold text-gray-800 mt-0.5">{d.itemDescription}</p>
                            <p className="text-sm text-gray-500">From: {d.businessName}</p>
                          </div>
                          <StatusBadge status={d.status} />
                        </div>

                        {/* Progress bar */}
                        <div className="mb-4">
                          <div className="flex justify-between mb-2">
                            {statusSteps.slice(0, -1).map((s, i) => (
                              <div key={s} className="flex flex-col items-center gap-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  i <= step
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-400"
                                }`}>
                                  {i < step ? "✓" : i + 1}
                                </div>
                                <span className="text-xs text-gray-400 hidden md:block">
                                  {s.replace(/_/g, " ")}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="relative h-1.5 bg-gray-100 rounded-full">
                            <div
                              className="absolute h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${(step / (statusSteps.length - 2)) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
                          <div>
                            <span className="text-xs text-gray-400">Driver</span>
                            <p className="font-medium text-gray-700 mt-0.5">
                              {d.driverName || "Waiting for driver..."}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400">Deliver to</span>
                            <p className="font-medium text-gray-700 mt-0.5">{d.dropoffAddress}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed deliveries */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Completed ({completed.length})
                </h2>
                <div className="space-y-3">
                  {completed.map((d) => (
                    <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{d.itemDescription}</p>
                          <p className="text-sm text-gray-400">
                            {d.businessName} • {new Date(d.deliveredAt || d.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>

                      {/* Rating */}
                      {!d.rating && (
                        <div className="mt-4 pt-4 border-t border-gray-50">
                          <p className="text-sm text-gray-500 mb-2">Rate your delivery</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onClick={() => handleRate(d.id, star)}
                                className={`text-2xl transition hover:scale-110 ${
                                  (rating[d.id] || 0) >= star ? "text-yellow-400" : "text-gray-200"
                                }`}>
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {d.rating && (
                        <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          You rated this {d.rating}/5
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}