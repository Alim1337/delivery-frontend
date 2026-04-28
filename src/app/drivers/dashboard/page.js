"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { MapPin, Package, Star, CheckCircle, Truck } from "lucide-react";

const links = [
  { href: "/drivers/dashboard", label: "Available Jobs" },
  { href: "/drivers/my-deliveries", label: "My History" },
];

const nextStatus = {
  ACCEPTED: "PICKED_UP",
  PICKED_UP: "ON_THE_WAY",
  ON_THE_WAY: "DELIVERED",
};

const nextLabel = {
  ACCEPTED: "Mark as Picked Up",
  PICKED_UP: "On the Way",
  ON_THE_WAY: "Mark Delivered ✓",
};

export default function DriverDashboard() {
  const router = useRouter();
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("available");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "DRIVER") { router.push("/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [availRes, myRes, profileRes] = await Promise.all([
        api.get("/api/deliveries/available"),
        api.get("/api/deliveries/my-active"),
        api.get("/api/profile/driver").catch(() => ({ data: null })),
      ]);
      setAvailable(availRes.data);
      setMyDeliveries(myRes.data);
      setProfile(profileRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.patch(`/api/deliveries/${id}/accept`);
      toast.success("Delivery accepted!");
      fetchAll();
      setTab("active");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to accept");
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/api/deliveries/${id}/status`, { status });
      toast.success(status === "DELIVERED" ? "Delivery completed! 🎉" : "Status updated!");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update");
    }
  };

  const activeDeliveries = myDeliveries.filter(
    d => !["DELIVERED", "CANCELLED"].includes(d.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-4xl mx-auto p-4 md:p-6">

        {/* Profile card */}
        {profile && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 md:p-5 mb-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-xs">Your vehicle</p>
                <p className="text-lg font-bold mt-0.5">
                  {profile.vehicleType} — {profile.vehiclePlate}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span className="font-bold">{profile.rating?.toFixed(1) || "—"}</span>
                </div>
                <p className="text-green-100 text-xs mt-0.5">{profile.totalDeliveries} deliveries</p>
              </div>
            </div>
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                profile.available
                  ? "bg-white/20 text-white"
                  : "bg-red-400/30 text-red-100"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile.available ? "bg-green-300 animate-pulse" : "bg-red-300"}`} />
                {profile.available ? "Available for deliveries" : "Currently on a delivery"}
              </span>
            </div>
          </div>
        )}

        {/* No profile warning */}
        {!profile && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <p className="text-yellow-800 font-medium text-sm">⚠️ Complete your driver profile first</p>
            <button onClick={() => router.push("/driver/setup")}
              className="mt-2 text-sm bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition">
              Complete Setup →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { key: "available", label: `Available (${available.length})` },
            { key: "active", label: `Active (${activeDeliveries.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                tab === t.key
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : tab === "available" ? (
          <div className="space-y-4">
            {available.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 md:p-12 text-center border border-gray-100">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No deliveries available</p>
                <p className="text-gray-300 text-sm mt-1">Check back soon!</p>
              </div>
            ) : available.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-gray-800 truncate">{d.itemDescription}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">#{d.id}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600 flex-shrink-0">{d.price} DA</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium">Pickup: </span>
                      <span className="text-gray-500">{d.pickupAddress}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium">Deliver to: </span>
                      <span className="text-gray-500">{d.dropoffAddress}</span>
                    </div>
                  </div>
                  {/* Business owner row */}
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium">Business: </span>
                      <span className="text-gray-500">{d.businessName}</span>
                    </div>
                  </div>
                  {/* Customer row */}
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="font-medium">Customer: </span>
                      <span className="text-gray-500">{d.customerName} — {d.customerPhone}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleAccept(d.id)}
                  disabled={!profile?.available}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition">
                  {profile?.available ? "Accept Delivery" : "Finish current delivery first"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 md:p-12 text-center border border-gray-100">
                <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No active deliveries</p>
                <button onClick={() => setTab("available")}
                  className="mt-3 text-sm text-green-600 font-medium hover:underline">
                  Browse available jobs →
                </button>
              </div>
            ) : activeDeliveries.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-gray-800 truncate">{d.itemDescription}</p>
                    {/* Business + Customer in subtitle */}
                    <p className="text-xs text-gray-400 mt-0.5">
                      🏪 {d.businessName} &nbsp;·&nbsp; 👤 {d.customerName} — {d.customerPhone}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{d.dropoffAddress}</span>
                </div>
                {nextStatus[d.status] && (
                  <button onClick={() => handleStatusUpdate(d.id, nextStatus[d.status])}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium transition">
                    {nextLabel[d.status]}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}