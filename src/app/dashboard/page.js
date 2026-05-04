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
  Building2, User, ExternalLink, Download,
  FileText, CheckCircle, Clock, BarChart3,
  Star, MapPin
} from "lucide-react";

const links = [{ href: "/dashboard", label: "Admin Panel" }];

const ROLE_COLORS = {
  CUSTOMER: "bg-blue-100 text-blue-700",
  DRIVER:   "bg-green-100 text-green-700",
  BUSINESS: "bg-purple-100 text-purple-700",
  ADMIN:    "bg-red-100 text-red-700",
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

  // ── EXPORT FUNCTIONS ──────────────────────────────────────────────────────

  const exportUsersExcel = async () => {
    const XLSX = (await import("xlsx")).default;
    const data = filteredUsers.map(u => ({
      "ID": u.id,
      "First Name": u.firstName,
      "Last Name": u.lastName,
      "Email": u.email,
      "Phone": u.phone || "",
      "Role": u.role,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    // Auto column widths
    ws["!cols"] = [
      { wch: 8 }, { wch: 15 }, { wch: 15 },
      { wch: 30 }, { wch: 15 }, { wch: 12 }
    ];
    XLSX.writeFile(wb, `deliverflow-users-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Users exported to Excel!");
  };

  const exportDeliveriesExcel = async () => {
    const XLSX = (await import("xlsx")).default;
    const data = filteredDeliveries.map(d => ({
      "ID": d.id,
      "Tracking Code": d.trackingCode,
      "Business": d.businessName,
      "Customer": d.customerName,
      "Driver": d.driverName || "Unassigned",
      "Item": d.itemDescription,
      "Pickup": d.pickupAddress,
      "Dropoff": d.dropoffAddress,
      "Price (DA)": d.price,
      "Status": d.status,
      "Rating": d.rating || "",
      "Created": new Date(d.createdAt).toLocaleDateString(),
      "Delivered": d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Deliveries");
    ws["!cols"] = [
      { wch: 6 }, { wch: 16 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 30 },
      { wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 14 }, { wch: 14 }
    ];
    XLSX.writeFile(wb, `deliverflow-deliveries-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Deliveries exported to Excel!");
  };

  const exportStatsPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const now = new Date().toLocaleDateString();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text("DeliverFlow", 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text("Admin Report", 14, 30);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on ${now}`, 14, 38);

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.line(14, 42, 196, 42);

    // Summary stats
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text("Summary", 14, 52);

    autoTable(doc, {
      startY: 56,
      head: [["Metric", "Value"]],
      body: [
        ["Total Users", stats.total],
        ["Customers", stats.customers],
        ["Drivers", stats.drivers],
        ["Businesses", stats.businesses],
        ["Total Deliveries", stats.totalDeliveries],
        ["Active Deliveries", stats.activeDeliveries],
        ["Completed Deliveries", stats.completedDeliveries],
        ["Cancelled Deliveries", stats.cancelledDeliveries],
        ["Total Revenue (DA)", `${stats.revenue.toLocaleString()} DA`],
        ["Average Delivery Price (DA)", `${stats.avgPrice} DA`],
        ["Completion Rate", `${stats.completionRate}%`],
      ],
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: "bold" } },
    });

    // Top drivers
    const topDrivers = getTopDrivers();
    if (topDrivers.length > 0) {
      doc.addPage();
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text("Top Drivers", 14, 20);

      autoTable(doc, {
        startY: 24,
        head: [["Driver", "Deliveries", "Revenue (DA)", "Avg Rating"]],
        body: topDrivers.map(d => [
          d.name, d.count, `${d.revenue} DA`, d.rating
        ]),
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 10 },
      });
    }

    // Recent deliveries
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    const afterDriversY = doc.lastAutoTable?.finalY || 24;
    doc.text("Recent Deliveries", 14, afterDriversY + 16);

    autoTable(doc, {
      startY: afterDriversY + 20,
      head: [["#", "Tracking", "Business", "Customer", "Price", "Status", "Date"]],
      body: deliveries.slice(0, 20).map(d => [
        d.id,
        d.trackingCode,
        d.businessName,
        d.customerName,
        `${d.price} DA`,
        d.status.replace(/_/g, " "),
        new Date(d.createdAt).toLocaleDateString(),
      ]),
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9 },
    });

    doc.save(`deliverflow-report-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF report downloaded!");
  };

  // ── COMPUTED STATS ─────────────────────────────────────────────────────────

  const stats = {
    total: users.length,
    customers: users.filter(u => u.role === "CUSTOMER").length,
    drivers: users.filter(u => u.role === "DRIVER").length,
    businesses: users.filter(u => u.role === "BUSINESS").length,
    admins: users.filter(u => u.role === "ADMIN").length,
    totalDeliveries: deliveries.length,
    activeDeliveries: deliveries.filter(d => !["DELIVERED","CANCELLED"].includes(d.status)).length,
    completedDeliveries: deliveries.filter(d => d.status === "DELIVERED").length,
    cancelledDeliveries: deliveries.filter(d => d.status === "CANCELLED").length,
    pendingDeliveries: deliveries.filter(d => d.status === "PENDING").length,
    revenue: deliveries
      .filter(d => d.status === "DELIVERED")
      .reduce((sum, d) => sum + (d.price || 0), 0),
    avgPrice: deliveries.length > 0
      ? Math.round(deliveries.reduce((s, d) => s + (d.price || 0), 0) / deliveries.length)
      : 0,
    completionRate: deliveries.length > 0
      ? Math.round((deliveries.filter(d => d.status === "DELIVERED").length / deliveries.length) * 100)
      : 0,
    ratedDeliveries: deliveries.filter(d => d.rating).length,
    avgRating: deliveries.filter(d => d.rating).length > 0
      ? (deliveries.filter(d => d.rating).reduce((s, d) => s + d.rating, 0) /
         deliveries.filter(d => d.rating).length).toFixed(1)
      : "—",
  };

  const getTopDrivers = () => {
    const map = {};
    deliveries.filter(d => d.driverName).forEach(d => {
      if (!map[d.driverName]) map[d.driverName] = { name: d.driverName, count: 0, revenue: 0, ratings: [] };
      map[d.driverName].count++;
      if (d.status === "DELIVERED") map[d.driverName].revenue += (d.price || 0);
      if (d.rating) map[d.driverName].ratings.push(d.rating);
    });
    return Object.values(map)
      .map(d => ({
        ...d,
        rating: d.ratings.length > 0
          ? (d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length).toFixed(1)
          : "—"
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getTopBusinesses = () => {
    const map = {};
    deliveries.forEach(d => {
      if (!map[d.businessName]) map[d.businessName] = { name: d.businessName, count: 0, revenue: 0 };
      map[d.businessName].count++;
      if (d.status === "DELIVERED") map[d.businessName].revenue += (d.price || 0);
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  };

  // Filtered data
  const filteredUsers = users.filter(u => {
    const matchSearch = userSearch === "" ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredDeliveries = deliveries.filter(d => {
    const matchSearch = deliverySearch === "" ||
      d.customerName?.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      d.driverName?.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      d.businessName?.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      d.trackingCode?.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      d.itemDescription?.toLowerCase().includes(deliverySearch.toLowerCase());
    const matchStatus = deliveryStatusFilter === "ALL" || d.status === deliveryStatusFilter;
    return matchSearch && matchStatus;
  });

  const topDrivers = getTopDrivers();
  const topBusinesses = getTopBusinesses();

  const tabs = [
    { key: "overview",   label: "Overview",   icon: BarChart3 },
    { key: "users",      label: `Users (${users.length})`, icon: Users },
    { key: "deliveries", label: `Deliveries (${deliveries.length})`, icon: Package },
  ];

  // ── UI HELPERS ─────────────────────────────────────────────────────────────

  const StatCard = ({ label, value, icon: Icon, color, sub }) => {
    const colors = {
      blue:   { bg: "bg-blue-50",   text: "text-blue-600",   val: "text-blue-700" },
      green:  { bg: "bg-green-50",  text: "text-green-600",  val: "text-green-700" },
      purple: { bg: "bg-purple-50", text: "text-purple-600", val: "text-purple-700" },
      red:    { bg: "bg-red-50",    text: "text-red-600",    val: "text-red-700" },
      yellow: { bg: "bg-yellow-50", text: "text-yellow-600", val: "text-yellow-700" },
      gray:   { bg: "bg-gray-50",   text: "text-gray-600",   val: "text-gray-700" },
    };
    const c = colors[color] || colors.gray;
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
            <Icon className={`w-4 h-4 ${c.text}`} />
          </div>
        </div>
        <p className={`text-2xl font-bold ${c.val}`}>{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    );
  };

  const SectionHeader = ({ title, children }) => (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-7xl mx-auto p-4 md:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-gray-500 text-sm">DeliverFlow system management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportStatsPDF}
              className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl transition">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:block">PDF Report</span>
            </button>
            <button onClick={() => fetchAll(true)} disabled={refreshing}
              className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:block">Refresh</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
                  tab === t.key
                    ? "bg-gray-900 text-white shadow-sm"
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

            {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
            {tab === "overview" && (
              <div className="space-y-6">

                {/* Users section */}
                <div>
                  <SectionHeader title="👥 Users" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Total Users"  value={stats.total}     icon={Users}    color="gray" />
                    <StatCard label="Customers"    value={stats.customers} icon={User}     color="blue" />
                    <StatCard label="Drivers"      value={stats.drivers}   icon={Truck}    color="green" />
                    <StatCard label="Businesses"   value={stats.businesses} icon={Building2} color="purple" />
                  </div>
                </div>

                {/* Deliveries section */}
                <div>
                  <SectionHeader title="📦 Deliveries" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Total"     value={stats.totalDeliveries}     icon={Package}      color="gray" />
                    <StatCard label="Active"    value={stats.activeDeliveries}    icon={Clock}        color="blue"
                      sub={`${stats.pendingDeliveries} pending`} />
                    <StatCard label="Completed" value={stats.completedDeliveries} icon={CheckCircle}  color="green"
                      sub={`${stats.completionRate}% rate`} />
                    <StatCard label="Cancelled" value={stats.cancelledDeliveries} icon={XCircle}      color="red" />
                  </div>
                </div>

                {/* Revenue section */}
                <div>
                  <SectionHeader title="💰 Revenue & Ratings" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Total Revenue"  value={`${stats.revenue.toLocaleString()} DA`} icon={TrendingUp} color="green"
                      sub="from completed deliveries" />
                    <StatCard label="Avg Price"       value={`${stats.avgPrice} DA`}    icon={BarChart3} color="blue" />
                    <StatCard label="Avg Rating"      value={stats.avgRating}            icon={Star}      color="yellow"
                      sub={`${stats.ratedDeliveries} rated`} />
                    <StatCard label="Completion Rate" value={`${stats.completionRate}%`} icon={CheckCircle} color="purple" />
                  </div>
                </div>

                {/* Top performers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Top drivers */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-green-600" />
                        Top Drivers
                      </h3>
                      <span className="text-xs text-gray-400">by deliveries</span>
                    </div>
                    {topDrivers.length === 0 ? (
                      <p className="p-6 text-center text-sm text-gray-400">No driver data yet</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {topDrivers.map((d, i) => (
                          <div key={d.name} className="flex items-center gap-3 p-3.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              i === 0 ? "bg-yellow-100 text-yellow-700" :
                              i === 1 ? "bg-gray-100 text-gray-600" :
                              i === 2 ? "bg-orange-100 text-orange-700" :
                              "bg-gray-50 text-gray-500"
                            }`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
                              <p className="text-xs text-gray-400">{d.revenue} DA revenue</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-gray-800">{d.count}</p>
                              <div className="flex items-center gap-0.5 justify-end">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs text-gray-500">{d.rating}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top businesses */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-600" />
                        Top Businesses
                      </h3>
                      <span className="text-xs text-gray-400">by deliveries</span>
                    </div>
                    {topBusinesses.length === 0 ? (
                      <p className="p-6 text-center text-sm text-gray-400">No business data yet</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {topBusinesses.map((b, i) => (
                          <div key={b.name} className="flex items-center gap-3 p-3.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              i === 0 ? "bg-yellow-100 text-yellow-700" :
                              i === 1 ? "bg-gray-100 text-gray-600" :
                              i === 2 ? "bg-orange-100 text-orange-700" :
                              "bg-gray-50 text-gray-500"
                            }`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{b.name}</p>
                              <p className="text-xs text-gray-400">{b.revenue} DA revenue</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-gray-800">{b.count}</p>
                              <p className="text-xs text-gray-400">deliveries</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent deliveries */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Recent Activity
                    </h3>
                    <button onClick={() => setTab("deliveries")}
                      className="text-xs text-blue-600 hover:underline">
                      View all →
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {deliveries.slice(0, 8).map(d => (
                      <div key={d.id} className="flex items-center gap-3 p-3.5 hover:bg-gray-50 transition">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{d.itemDescription}</p>
                          <p className="text-xs text-gray-400">
                            🏪 {d.businessName} → 👤 {d.customerName}
                            {d.driverName ? ` · 🚗 ${d.driverName}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 hidden sm:block">{d.price} DA</span>
                          <StatusBadge status={d.status} />
                          <a href={`/track/${d.trackingCode}`} target="_blank"
                            className="text-gray-400 hover:text-blue-500 transition">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {deliveries.length === 0 && (
                      <p className="p-8 text-center text-gray-400 text-sm">No deliveries yet</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ── USERS TAB ─────────────────────────────────────────────────── */}
            {tab === "users" && (
              <div className="space-y-4">

                {/* Users stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "All", count: users.length, role: "ALL", color: "gray" },
                    { label: "Customers", count: stats.customers, role: "CUSTOMER", color: "blue" },
                    { label: "Drivers", count: stats.drivers, role: "DRIVER", color: "green" },
                    { label: "Businesses", count: stats.businesses, role: "BUSINESS", color: "purple" },
                  ].map(r => (
                    <button key={r.label} onClick={() => setUserRoleFilter(r.role)}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        userRoleFilter === r.role
                          ? "border-gray-800 bg-gray-800 text-white"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}>
                      <p className={`text-xl font-bold ${userRoleFilter === r.role ? "text-white" : "text-gray-800"}`}>
                        {r.count}
                      </p>
                      <p className={`text-xs mt-0.5 ${userRoleFilter === r.role ? "text-gray-300" : "text-gray-500"}`}>
                        {r.label}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Search + export */}
                  <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        placeholder="Search by name or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                    <button onClick={exportUsersExcel}
                      className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-xl transition whitespace-nowrap">
                      <Download className="w-4 h-4" />
                      Export Excel
                    </button>
                  </div>

                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-500">
                      {filteredUsers.length} of {users.length} users
                    </p>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {filteredUsers.length === 0 ? (
                      <p className="p-8 text-center text-gray-400 text-sm">No users found</p>
                    ) : filteredUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-gray-600 text-sm">
                          {((u.firstName?.[0] || "") + (u.lastName?.[0] || "") || u.email?.[0] || "?").toUpperCase().slice(0,2)}
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
                          <span className="text-xs text-gray-400 hidden md:block">#{u.id}</span>
                          {u.role !== "ADMIN" && (
                            <button onClick={() => handleDeleteUser(u.id, u.email)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-1"
                              title="Delete user">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── DELIVERIES TAB ────────────────────────────────────────────── */}
            {tab === "deliveries" && (
              <div className="space-y-4">

                {/* Status quick filters */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {STATUS_FILTERS.map(s => (
                    <button key={s} onClick={() => setDeliveryStatusFilter(s)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap flex-shrink-0 ${
                        deliveryStatusFilter === s
                          ? "bg-gray-800 text-white"
                          : "bg-white text-gray-600 border border-gray-100 hover:border-gray-200"
                      }`}>
                      {s === "ALL"
                        ? `All (${deliveries.length})`
                        : `${s.replace(/_/g, " ")} (${deliveries.filter(d => d.status === s).length})`}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Search + export */}
                  <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        placeholder="Search by customer, driver, business, tracking code..."
                        value={deliverySearch}
                        onChange={(e) => setDeliverySearch(e.target.value)}
                      />
                    </div>
                    <button onClick={exportDeliveriesExcel}
                      className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-xl transition whitespace-nowrap">
                      <Download className="w-4 h-4" />
                      Export Excel
                    </button>
                  </div>

                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-500">
                      {filteredDeliveries.length} of {deliveries.length} deliveries
                    </p>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y divide-gray-50">
                    {filteredDeliveries.length === 0 ? (
                      <p className="p-8 text-center text-gray-400 text-sm">No deliveries found</p>
                    ) : filteredDeliveries.map(d => (
                      <div key={d.id} className="p-4 space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="font-medium text-gray-800 text-sm truncate">{d.itemDescription}</p>
                            <p className="text-xs text-gray-400 font-mono">#{d.id} · {d.trackingCode}</p>
                          </div>
                          <StatusBadge status={d.status} />
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <p>🏪 {d.businessName}</p>
                          <p>👤 {d.customerName}</p>
                          {d.driverName && <p>🚗 {d.driverName}</p>}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-bold text-gray-800 text-sm">{d.price} DA</span>
                          <div className="flex items-center gap-3">
                            <a href={`/track/${d.trackingCode}`} target="_blank"
                              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                              <ExternalLink className="w-3 h-3" /> Track
                            </a>
                            {!["DELIVERED", "CANCELLED"].includes(d.status) && (
                              <button onClick={() => handleCancelDelivery(d.id)}
                                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600">
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
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                          <tr>
                            {["#", "Tracking", "Business", "Customer", "Driver", "Item", "Price", "Status", "Date", ""].map(h => (
                              <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredDeliveries.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">#{d.id}</td>
                              <td className="px-4 py-3.5">
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                                  {d.trackingCode}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-xs font-medium text-purple-700 max-w-24 truncate">{d.businessName}</td>
                              <td className="px-4 py-3.5 text-xs text-gray-600 max-w-24 truncate">{d.customerName}</td>
                              <td className="px-4 py-3.5 text-xs text-gray-500">
                                {d.driverName || <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-gray-500 max-w-28 truncate">{d.itemDescription}</td>
                              <td className="px-4 py-3.5 text-xs font-semibold text-gray-800 whitespace-nowrap">{d.price} DA</td>
                              <td className="px-4 py-3.5"><StatusBadge status={d.status} /></td>
                              <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                {new Date(d.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <a href={`/track/${d.trackingCode}`} target="_blank"
                                    className="text-gray-400 hover:text-blue-500 transition" title="Track">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  {!["DELIVERED", "CANCELLED"].includes(d.status) && (
                                    <button onClick={() => handleCancelDelivery(d.id)}
                                      className="text-red-400 hover:text-red-600 transition" title="Cancel">
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
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}