"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import {
  Users, Truck, Package, Shield,
  Trash2, Search, RefreshCw, TrendingUp
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/customers", label: "Customers" },
  { href: "/drivers", label: "Drivers" },
  { href: "/orders", label: "Orders" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({ customers: 0, drivers: 0, deliveries: 0, revenue: 0 });
  const [deliveries, setDeliveries] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  }, []);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [customersRes, driversRes, ordersRes, usersRes] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/drivers"),
        api.get("/api/orders?page=0&size=100"),
        api.get("/api/users/customers"),
      ]);
      setStats({
        customers: customersRes.data.length,
        drivers: driversRes.data.length,
        deliveries: ordersRes.data.totalElements || 0,
        revenue: 0,
      });
      setUsers(usersRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await api.delete(`/api/customers/${id}`);
      toast.success("Customer deleted");
      fetchAll(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete");
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: "Customers", value: stats.customers, icon: Users, color: "blue", tab: "users" },
    { label: "Drivers", value: stats.drivers, icon: Truck, color: "green", tab: "drivers" },
    { label: "Deliveries", value: stats.deliveries, icon: Package, color: "purple", tab: "deliveries" },
  ];

  const colorMap = {
    blue:   { bg: "bg-blue-50",   text: "text-blue-600" },
    green:  { bg: "bg-green-50",  text: "text-green-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-6xl mx-auto p-4 md:p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-gray-500 text-sm">Full system access</p>
            </div>
          </div>
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          {statCards.map((s) => {
            const Icon = s.icon;
            const c = colorMap[s.color];
            return (
              <button key={s.label} onClick={() => setTab(s.tab)}
                className={`bg-white rounded-xl p-4 shadow-sm border-2 transition text-left ${
                  tab === s.tab ? "border-blue-500" : "border-gray-100 hover:border-gray-200"
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
                  <Icon className={`w-4 h-4 ${c.text}`} />
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? "—" : s.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              System Overview
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span>Total registered customers</span>
                <span className="font-semibold text-gray-800">{stats.customers}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span>Total registered drivers</span>
                <span className="font-semibold text-gray-800">{stats.drivers}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span>Total deliveries</span>
                <span className="font-semibold text-gray-800">{stats.deliveries}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Admin account</span>
                <span className="font-semibold text-red-600">admin@delivery.com</span>
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                  <button onClick={() => handleDeleteCustomer(u.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">No customers found</div>
              )}
            </div>
          </div>
        )}

        {tab === "drivers" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">All Drivers</h2>
            </div>
            <p className="p-6 text-sm text-gray-400 text-center">
              Driver management coming soon
            </p>
          </div>
        )}

        {tab === "deliveries" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">All Deliveries</h2>
            </div>
            <p className="p-6 text-sm text-gray-400 text-center">
              Use the Orders menu above to manage deliveries
            </p>
          </div>
        )}
      </div>
    </div>
  );
}