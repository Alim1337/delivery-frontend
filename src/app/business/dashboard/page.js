"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { invalidatePattern } from "@/lib/cache";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import {
  Plus, Package, Clock, CheckCircle,
  XCircle, Copy, ExternalLink, Search,
  RefreshCw, Download
} from "lucide-react";

const links = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/new-delivery", label: "New Delivery" },
  { href: "/business/profile", label: "Profile" },
];

const STATUS_FILTERS = ["ALL", "PENDING", "ACCEPTED", "PICKED_UP", "ON_THE_WAY", "DELIVERED", "CANCELLED"];

export default function BusinessDashboard() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "BUSINESS") { router.push("/login"); return; }
    fetchDeliveries();

    // Poll every 60 seconds instead of 30
    intervalRef.current = setInterval(() => fetchDeliveries(true), 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const fetchDeliveries = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get("/api/deliveries/my-business");
      setDeliveries(res.data);
    } catch {
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const copyTrackingLink = (code) => {
    navigator.clipboard.writeText(`${window.location.origin}/track/${code}`);
    toast.success("Tracking link copied!");
  };

  const handleCancel = async (id) => {
    if (!confirm("Cancel this delivery?")) return;
    try {
      await api.patch(`/api/deliveries/${id}/cancel`);
      toast.success("Delivery cancelled");
      invalidatePattern("delivery");
      fetchDeliveries(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to cancel");
    }
  };

  const exportCSV = () => {
    if (deliveries.length === 0) { toast.error("No deliveries to export"); return; }
    const headers = ["ID", "Tracking", "Customer", "Driver", "Item", "Price (DA)", "Status", "Date"];
    const rows = deliveries.map(d => [
      d.id, d.trackingCode, d.customerName,
      d.driverName || "Unassigned", d.itemDescription,
      d.price, d.status,
      new Date(d.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `deliveries-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  };

  // Filter + search
  const filtered = deliveries
    .filter(d => filter === "ALL" || d.status === filter)
    .filter(d =>
      search === "" ||
      d.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      d.trackingCode?.toLowerCase().includes(search.toLowerCase()) ||
      d.itemDescription?.toLowerCase().includes(search.toLowerCase())
    );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-6xl mx-auto p-4 md:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Business Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your delivery requests</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2.5 rounded-xl text-sm font-medium transition">
              <Download className="w-4 h-4" />
              <span className="hidden sm:block">Export</span>
            </button>
            <button onClick={() => fetchDeliveries(true)} disabled={refreshing}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-2.5 rounded-xl text-sm transition disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button onClick={() => router.push("/business/new-delivery")}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
              <Plus className="w-4 h-4" />
              New Delivery
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
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

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              placeholder="Search by customer, tracking code, or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700">
            {STATUS_FILTERS.map(s => (
              <option key={s} value={s}>{s === "ALL" ? "All statuses" : s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Loading deliveries...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">
                {deliveries.length === 0 ? "No deliveries yet" : "No results match your filter"}
              </p>
              {deliveries.length === 0 && (
                <button onClick={() => router.push("/business/new-delivery")}
                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                  + New Delivery
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {filtered.map((d) => (
                  <div key={d.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-medium text-gray-800 text-sm truncate">{d.itemDescription}</p>
                        <p className="text-xs text-gray-400 mt-0.5">👤 {d.customerName}</p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                        {d.trackingCode}
                      </span>
                      <button onClick={() => copyTrackingLink(d.trackingCode)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a href={`/track/${d.trackingCode}`} target="_blank"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{d.driverName ? `🚗 ${d.driverName}` : "No driver yet"}</span>
                      <span className="font-semibold text-gray-700">{d.price} DA</span>
                    </div>
                    {!["DELIVERED", "CANCELLED"].includes(d.status) && (
                      <button onClick={() => handleCancel(d.id)}
                        className="w-full text-xs text-red-400 hover:text-red-600 font-medium py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition">
                        Cancel delivery
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      {["#", "Tracking", "Customer", "Driver", "Item", "Price", "Status", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">#{d.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {d.trackingCode}
                            </span>
                            <button onClick={() => copyTrackingLink(d.trackingCode)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-gray-800">{d.customerName}</td>
                        <td className="px-4 py-3.5 text-gray-500">
                          {d.driverName || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 max-w-28 truncate">{d.itemDescription}</td>
                        <td className="px-4 py-3.5 font-medium text-gray-800">{d.price} DA</td>
                        <td className="px-4 py-3.5"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <a href={`/track/${d.trackingCode}`} target="_blank"
                              className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-xs font-medium">
                              Track <ExternalLink className="w-3 h-3" />
                            </a>
                            {!["DELIVERED", "CANCELLED"].includes(d.status) && (
                              <button onClick={() => handleCancel(d.id)}
                                className="text-red-400 hover:text-red-600 text-xs font-medium">
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-center text-gray-300 text-xs mt-4">
            Showing {filtered.length} of {deliveries.length} deliveries
          </p>
        )}
      </div>
    </div>
  );
}