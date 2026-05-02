"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { MapPin, Package, Star, CheckCircle, Truck } from "lucide-react";

const links = [
  { href: "/drivers/dashboard", label: "Available Jobs" },
  { href: "/drivers/my-deliveries", label: "My History" },
  { href: "/drivers/profile", label: "Profile" },
];

const nextStatus = {
  ACCEPTED: "PICKED_UP",
  PICKED_UP: "ON_THE_WAY",
  ON_THE_WAY: "DELIVERED",
};

const nextLabel = {
  ACCEPTED: "📦 Mark as Picked Up",
  PICKED_UP: "🛵 On the Way",
  ON_THE_WAY: "✅ Mark Delivered",
};

export default function DriverDashboard() {
  const router = useRouter();
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("available");
  const [actionLoading, setActionLoading] = useState(null);
  const fetchIntervalRef = useRef(null);
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "DRIVER") { router.push("/login"); return; }

    fetchAll();

    // Fetch every 45 seconds
    fetchIntervalRef.current = setInterval(() => fetchAll(true), 45000);

    // Send location every 20 seconds
    locationIntervalRef.current = setInterval(sendLocation, 20000);
    sendLocation(); // send immediately

    return () => {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, []);

  const sendLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.patch("/api/deliveries/location", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        } catch {}
      },
      () => {}
    );
  };

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAccept = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/api/deliveries/${id}/accept`);
      toast.success("Delivery accepted! 🎉");
      await fetchAll(true);
      setTab("active");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to accept");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id);
    try {
      await api.patch(`/api/deliveries/${id}/status`, { status });
      toast.success(status === "DELIVERED" ? "Delivery completed! 🎉" : "Status updated!");
      await fetchAll(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update");
    } finally {
      setActionLoading(null);
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
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 md:p-5 mb-5 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-green-100 text-xs">Your vehicle</p>
                <p className="text-lg font-bold">{profile.vehicleType} — {profile.vehiclePlate}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span className="font-bold">{profile.rating?.toFixed(1) || "—"}</span>
                </div>
                <p className="text-green-100 text-xs">{profile.totalDeliveries} deliveries</p>
              </div>
            </div>
            <div className="mt-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                profile.available ? "bg-white/20" : "bg-red-400/30 text-red-100"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile.available ? "bg-green-300 animate-pulse" : "bg-red-300"}`} />
                {profile.available ? "Available for deliveries" : "Currently on a delivery"}
              </span>
            </div>
          </div>
        )}

        {!profile && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-5">
            <p className="text-yellow-800 font-medium text-sm">⚠️ Complete your driver profile first</p>
            <button onClick={() => router.push("/drivers/setup")}
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
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : tab === "available" ? (
          <div className="space-y-3">
            {available.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No deliveries available</p>
                <p className="text-gray-300 text-sm mt-1">Check back soon!</p>
              </div>
            ) : available.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-gray-800 truncate">{d.itemDescription}</p>
                    <p className="text-xs text-gray-400 font-mono">#{d.id}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600 flex-shrink-0">{d.price} DA</span>
                </div>
                <div className="space-y-1.5 text-sm mb-4">
                  {[
                    { dot: "bg-orange-400", label: "Business", value: d.businessName },
                    { dot: "bg-blue-400", label: "Pickup", value: d.pickupAddress },
                    { dot: "bg-green-400", label: "Deliver to", value: d.dropoffAddress },
                    { dot: "bg-purple-400", label: "Customer", value: `${d.customerName} — ${d.customerPhone}` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full ${row.dot} mt-1.5 flex-shrink-0`} />
                      <div className="min-w-0">
                        <span className="font-medium text-gray-600">{row.label}: </span>
                        <span className="text-gray-500">{row.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleAccept(d.id)}
                  disabled={!profile?.available || actionLoading === d.id}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-medium transition">
                  {actionLoading === d.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Accepting...
                    </span>
                  ) : profile?.available ? "Accept Delivery" : "Finish current delivery first"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {activeDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No active deliveries</p>
                <button onClick={() => setTab("available")}
                  className="mt-3 text-sm text-green-600 font-medium hover:underline">
                  Browse available jobs →
                </button>
              </div>
            ) : activeDeliveries.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-semibold text-gray-800 truncate">{d.itemDescription}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      🏪 {d.businessName} · 👤 {d.customerName} — {d.customerPhone}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>{d.dropoffAddress}</span>
                </div>
                {nextStatus[d.status] && (
                  <button
                    onClick={() => handleStatusUpdate(d.id, nextStatus[d.status])}
                    disabled={actionLoading === d.id}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition">
                    {actionLoading === d.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg>
                        Updating...
                      </span>
                    ) : nextLabel[d.status]}
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