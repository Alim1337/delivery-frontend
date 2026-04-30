"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Package, Clock, CheckCircle, XCircle, Copy, ExternalLink } from "lucide-react";

const links = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/new-delivery", label: "New Delivery" },
  { href: "/business/profile", label: "Profile" },
];

export default function BusinessDashboard() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "BUSINESS") {
      router.push("/login");
      return;
    }
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const res = await api.get("/api/deliveries/my-business");
      setDeliveries(res.data);
    } catch {
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingLink = (code) => {
    navigator.clipboard.writeText(`${window.location.origin}/track/${code}`);
    toast.success("Tracking link copied!");
  };

  const stats = [
    { label: "Total", value: deliveries.length, icon: Package, color: "blue" },
    { label: "Active", value: deliveries.filter(d => !["DELIVERED","CANCELLED"].includes(d.status)).length, icon: Clock, color: "yellow" },
    { label: "Delivered", value: deliveries.filter(d => d.status === "DELIVERED").length, icon: CheckCircle, color: "green" },
    { label: "Cancelled", value: deliveries.filter(d => d.status === "CANCELLED").length, icon: XCircle, color: "red" },
  ];

  const colorMap = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-600" },
    green:  { bg: "bg-green-50",  text: "text-green-600" },
    red:    { bg: "bg-red-50",    text: "text-red-600" },
  };
  const handleCancel = async (id) => {
  if (!confirm("Cancel this delivery?")) return;
  try {
    await api.patch(`/api/deliveries/${id}/cancel`);
    toast.success("Delivery cancelled");
    fetchDeliveries();
  } catch (err) {
    toast.error(err.response?.data?.error || "Failed to cancel");
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Business Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your delivery requests</p>
          </div>
          <button onClick={() => router.push("/business/new-delivery")}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            New Delivery
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            const c = colorMap[s.color];
            return (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Table / Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Recent Deliveries</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : deliveries.length === 0 ? (
            <div className="p-10 md:p-12 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No deliveries yet</p>
              <p className="text-gray-300 text-sm mt-1">Create your first delivery request</p>
              <button onClick={() => router.push("/business/new-delivery")}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                + New Delivery
              </button>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {deliveries.map((d) => (
                  <div key={d.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{d.itemDescription}</p>
                        <p className="text-xs text-gray-400 mt-0.5">To: {d.customerName}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                        {d.trackingCode}
                      </span>
                      <button onClick={() => copyTrackingLink(d.trackingCode)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition flex-shrink-0">
                        <Copy className="w-4 h-4" />
                      </button>
                      <a href={`/track/${d.trackingCode}`} target="_blank"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Driver: {d.driverName || "Unassigned"}</span>
                      <span className="font-semibold text-gray-700">{d.price} DA</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      {["#", "Tracking", "Customer", "Driver", "Items", "Price", "Status", ""].map(h => (
                        <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4 text-gray-400 font-mono text-xs">#{d.id}</td>
                        <td className="px-5 py-4">
  <div className="flex items-center gap-2">
    <a href={`/track/${d.trackingCode}`} target="_blank"
      className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium">
      Track <ExternalLink className="w-3 h-3" />
    </a>
    {!["DELIVERED", "CANCELLED"].includes(d.status) && (
      <button
        onClick={() => handleCancel(d.id)}
        className="text-red-400 hover:text-red-600 text-xs font-medium">
        Cancel
      </button>
    )}
    {!["DELIVERED", "CANCELLED"].includes(d.status) && (
  <button onClick={() => handleCancel(d.id)}
    className="text-xs text-red-400 hover:text-red-600 font-medium">
    Cancel delivery
  </button>
)}
  </div>
</td>
                        <td className="px-5 py-4 font-medium text-gray-800">{d.customerName}</td>
                        <td className="px-5 py-4 text-gray-500">
                          {d.driverName || <span className="text-gray-300">Unassigned</span>}
                        </td>
                        <td className="px-5 py-4 text-gray-500 max-w-32 truncate">{d.itemDescription}</td>
                        <td className="px-5 py-4 font-medium text-gray-800">{d.price} DA</td>
                        <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                        <td className="px-5 py-4">
                          <a href={`/track/${d.trackingCode}`} target="_blank"
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium">
                            Track <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}