"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import {
  Users, Truck, Package, Shield, Search,
  RefreshCw, Trash2, XCircle, TrendingUp,
  Building2, User, ChevronDown, ExternalLink
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview" },
];

const ROLE_COLORS = {
  CUSTOMER: "bg-blue-100 text-blue-700",
  DRIVER:   "bg-green-100 text-green-700",
  BUSINESS: "bg-purple-100 text-purple-700",
  ADMIN:    "bg-red-100 text-red-700",
};

const ROLE_ICONS = {
  CUSTOMER: User,
  DRIVER:   Truck,
  BUSINESS: Building2,
  ADMIN:    Shield,
};

const STATUS_FILTERS = [
  "ALL", "PENDING", "ACCEPTED", "PICKED_UP",
  "ON_THE_WAY", "DELIVERED", "CANCELLED"
];

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [deliverySearch, setDeliverySearch] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("ALL");
  const intervalRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) { router.push("/login"); return; }
    if (role !== "ADMIN") {
      if (role === "BUSINESS") router.push("/business/dashboard");
      else if (role === "DRIVER") router.push("/drivers/dashboard");
      else if (role === "CUSTOMER") router.push("/customers/dashboard");
      return;
    }
    fetchAll();
    intervalRef.current = setInterval(() => fetchAll(true), 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [usersRes, deliveriesRes] = await Promise.all([
        api.get("/api/users/all"),
        api.get("/api/deliveries/admin/all"),
      ]);
      setUsers(usersRes.data);
      setDeliveries(deliveriesRes.data);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleDeleteUser = async (id, email) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/users/${id}`);
      toast.success("User deleted");
      fetchAll(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete user");
    }
  };

  const handleCancelDelivery = async (id) => {
    if (!confirm("Cancel this delivery?")) return;
    try {
      await api.patch(`/api/deliveries/admin/${id}/cancel`);
      toast.success("Delivery cancelled");
      fetchAll(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to cancel");
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchSearch = userSearch === "" ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  // Filtered deliveries
  const filteredDeliveries = deliveries.filter(d => {
    const matchSearch = deliverySearch === "" ||
      d.customerName?.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      d.driverName?.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      d.businessName?.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      d.trackingCode?.toLowerCase().includes(deliverySearch.toLowerCase());
    const matchStatus = deliveryStatusFilter === "ALL" || d.status === deliveryStatusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: users.length,
    customers: users.filter(u => u.role === "CUSTOMER").length,
    drivers: users.filter(u => u.role === "DRIVER").length,
    businesses: users.filter(u => u.role === "BUSINESS").length,
    totalDeliveries: deliveries.length,
    activeDeliveries: deliveries.filter(d => !["DELIVERED","CANCELLED"].includes(d.status)).length,
    completedDeliveries: deliveries.filter(d => d.status === "DELIVERED").length,
    revenue: deliveries
      .filter(d => d.status === "DELIVERED")
      .reduce((sum, d) => sum + (d.price || 0), 0),
  };

  const tabs = [
    { key: "overview",   label: "Overview",   icon: TrendingUp },
    { key: "users",      label: `Users (${users.length})`, icon: Users },
    { key: "deliveries", label: `Deliveries (${deliveries.length})`, icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-7xl mx-auto p-4 md:p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-gray-500 text-sm">Full system control</p>
            </div>
          </div>
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>

        {/* Quick stats — always visible */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Users",      value: stats.total,              color: "bg-gray-800 text-white" },
              { label: "Active Deliveries",value: stats.activeDeliveries,   color: "bg-blue-600 text-white" },
              { label: "Completed",        value: stats.completedDeliveries, color: "bg-green-600 text-white" },
              { label: "Revenue (DA)",     value: `${stats.revenue.toLocaleString()}`, color: "bg-purple-600 text-white" },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl p-4 shadow-sm`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs opacity-80 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                  tab === t.key
                    ? "bg-gray-800 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                }`}>
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <div className="w-8 h-8 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading system data...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {tab === "overview" && (
              <div className="space-y-5">
                {/* Role breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">Users by Role</h2>
                  </div>
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { role: "CUSTOMER", count: stats.customers, icon: User, color: "blue" },
                      { role: "DRIVER",   count: stats.drivers,   icon: Truck, color: "green" },
                      { role: "BUSINESS", count: stats.businesses, icon: Building2, color: "purple" },
                      { role: "ADMIN",    count: users.filter(u => u.role === "ADMIN").length, icon: Shield, color: "red" },
                    ].map(r => {
                      const Icon = r.icon;
                      const colors = {
                        blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
                        green:  { bg: "bg-green-50",  text: "text-green-600" },
                        purple: { bg: "bg-purple-50", text: "text-purple-600" },
                        red:    { bg: "bg-red-50",    text: "text-red-600" },
                      };
                      const c = colors[r.color];
                      return (
                        <div key={r.role}
                          className="p-4 border border-gray-100 rounded-xl cursor-pointer hover:border-gray-200 transition"
                          onClick={() => { setTab("users"); setUserRoleFilter(r.role); }}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${c.bg}`}>
                            <Icon className={`w-4 h-4 ${c.text}`} />
                          </div>
                          <p className="text-2xl font-bold text-gray-800">{r.count}</p>
                          <p className="text-xs text-gray-500">{r.role}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">Deliveries Breakdown</h2>
                  </div>
                  <div className="p-4 space-y-3">
                    {[
                      { label: "Total deliveries", value: stats.totalDeliveries },
                      { label: "Active (in progress)", value: stats.activeDeliveries },
                      { label: "Completed", value: stats.completedDeliveries },
                      { label: "Cancelled", value: deliveries.filter(d => d.status === "CANCELLED").length },
                      { label: "Total revenue", value: `${stats.revenue.toLocaleString()} DA` },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-600">{row.label}</span>
                        <span className="font-semibold text-gray-800">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">Recent Deliveries</h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {deliveries.slice(0, 5).map(d => (
                      <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{d.itemDescription}</p>
                          <p className="text-xs text-gray-400">
                            {d.businessName} → {d.customerName}
                            {d.driverName ? ` · 🚗 ${d.driverName}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={d.status} />
                          <span className="text-xs text-gray-500 hidden sm:block">{d.price} DA</span>
                        </div>
                      </div>
                    ))}
                    {deliveries.length === 0 && (
                      <p className="p-8 text-center text-gray-400 text-sm">No deliveries yet</p>
                    )}
                  </div>
                  {deliveries.length > 5 && (
                    <div className="p-3 border-t border-gray-50">
                      <button onClick={() => setTab("deliveries")}
                        className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium">
                        View all {deliveries.length} deliveries →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {tab === "users" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-700">
                      <option value="ALL">All roles</option>
                      <option value="CUSTOMER">Customer</option>
                      <option value="DRIVER">Driver</option>
                      <option value="BUSINESS">Business</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-400">
                    Showing {filteredUsers.length} of {users.length} users
                  </p>
                </div>

                {/* User list */}
                <div className="divide-y divide-gray-50">
                  {filteredUsers.length === 0 ? (
                    <p className="p-8 text-center text-gray-400 text-sm">No users found</p>
                  ) : filteredUsers.map(u => {
                    const RoleIcon = ROLE_ICONS[u.role] || User;
                    return (
                      <div key={u.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-gray-600 text-sm">
                          {(u.firstName?.[0] || u.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-800">
                              {u.firstName} {u.lastName}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                          {u.phone && <p className="text-xs text-gray-400">{u.phone}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {u.role !== "ADMIN" && (
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete user">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DELIVERIES TAB */}
            {tab === "deliveries" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        placeholder="Search by customer, driver, business, or tracking code..."
                        value={deliverySearch}
                        onChange={(e) => setDeliverySearch(e.target.value)}
                      />
                    </div>
                    <select
                      value={deliveryStatusFilter}
                      onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                      className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-gray-700">
                      {STATUS_FILTERS.map(s => (
                        <option key={s} value={s}>
                          {s === "ALL" ? "All statuses" : s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-400">
                    Showing {filteredDeliveries.length} of {deliveries.length} deliveries
                  </p>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-50">
                  {filteredDeliveries.length === 0 ? (
                    <p className="p-8 text-center text-gray-400 text-sm">No deliveries found</p>
                  ) : filteredDeliveries.map(d => (
                    <div key={d.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-medium text-gray-800 text-sm truncate">{d.itemDescription}</p>
                          <p className="text-xs text-gray-400 font-mono">#{d.id} · {d.trackingCode}</p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>🏪 <span className="font-medium">{d.businessName}</span></p>
                        <p>👤 {d.customerName}</p>
                        {d.driverName && <p>🚗 {d.driverName}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800">{d.price} DA</span>
                        <div className="flex items-center gap-2">
                          <a href={`/track/${d.trackingCode}`} target="_blank"
                            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                            <ExternalLink className="w-3 h-3" /> Track
                          </a>
                          {!["DELIVERED", "CANCELLED"].includes(d.status) && (
                            <button onClick={() => handleCancelDelivery(d.id)}
                              className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  {filteredDeliveries.length === 0 ? (
                    <p className="p-8 text-center text-gray-400 text-sm">No deliveries found</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                          {["#", "Tracking", "Business", "Customer", "Driver", "Item", "Price", "Status", "Date", "Actions"].map(h => (
                            <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredDeliveries.map(d => (
                          <tr key={d.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">#{d.id}</td>
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {d.trackingCode}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-xs font-medium text-gray-700 max-w-24 truncate">{d.businessName}</p>
                            </td>
                            <td className="px-4 py-3.5 text-gray-600 text-xs max-w-24 truncate">{d.customerName}</td>
                            <td className="px-4 py-3.5 text-gray-500 text-xs">
                              {d.driverName || <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3.5 text-gray-500 text-xs max-w-28 truncate">{d.itemDescription}</td>
                            <td className="px-4 py-3.5 font-medium text-gray-800 text-xs whitespace-nowrap">{d.price} DA</td>
                            <td className="px-4 py-3.5"><StatusBadge status={d.status} /></td>
                            <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                              {new Date(d.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <a href={`/track/${d.trackingCode}`} target="_blank"
                                  className="text-blue-500 hover:text-blue-700 transition"
                                  title="Track">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                {!["DELIVERED", "CANCELLED"].includes(d.status) && (
                                  <button onClick={() => handleCancelDelivery(d.id)}
                                    className="text-red-400 hover:text-red-600 transition"
                                    title="Cancel delivery">
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}