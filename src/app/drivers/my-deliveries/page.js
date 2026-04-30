"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { Star, Package, TrendingUp } from "lucide-react";

const links = [
  { href: "/drivers/dashboard", label: "Available Jobs" },
  { href: "/drivers/my-deliveries", label: "My History" },
];

export default function DriverHistoryPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const earnings = completed.reduce((sum, d) => sum + (d.price || 0), 0);

  const stats = [
    { label: "Completed", value: completed.length, icon: Package, color: "green" },
    { label: "Total Earnings", value: `${earnings.toFixed(0)} DA`, icon: TrendingUp, color: "blue" },
    { label: "Rating", value: profile?.rating ? `${profile.rating.toFixed(1)}/5` : "—", icon: Star, color: "yellow" },
  ];

  const colorMap = {
    green:  "bg-green-50 text-green-600",
    blue:   "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">My Deliveries</h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 shadow-sm">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[s.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Completed Deliveries</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : completed.length === 0 ? (
            <div className="p-10 md:p-12 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No completed deliveries yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {completed.map((d) => (
                <div key={d.id} className="p-4 md:p-5 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-gray-800">{d.itemDescription}</p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        🏪 {d.businessName} → {d.dropoffAddress}
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">
                        {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : ""}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-800">{d.price} DA</p>
                      {d.rating && (
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-gray-500">{d.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}