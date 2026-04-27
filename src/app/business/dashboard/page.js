"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Package, Clock, CheckCircle, XCircle } from "lucide-react";

const links = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/new-delivery", label: "New Delivery" },
];

export default function BusinessDashboard() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "BUSINESS") { router.push("/login"); return; }
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

  const stats = [
    { label: "Total", value: deliveries.length, icon: Package, color: "blue" },
    { label: "Active", value: deliveries.filter(d => !["DELIVERED","CANCELLED"].includes(d.status)).length, icon: Clock, color: "yellow" },
    { label: "Delivered", value: deliveries.filter(d => d.status === "DELIVERED").length, icon: CheckCircle, color: "green" },
    { label: "Cancelled", value: deliveries.filter(d => d.status === "CANCELLED").length, icon: XCircle, color: "red" },
  ];

  const colorMap = {
    blue: "bg-blue-50 text-blue-600", yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600", red: "bg-red-50 text-red-600",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Business Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your delivery requests</p>
          </div>
          <button onClick={() => router.push("/business/new-delivery")}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
            <Plus className="w-4 h-4" />
            New Delivery
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[s.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Deliveries table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Recent Deliveries</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : deliveries.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No deliveries yet</p>
              <p className="text-gray-300 text-sm mt-1">Create your first delivery request</p>
              <button onClick={() => router.push("/business/new-delivery")}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm">
                + New Delivery
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    {["ID", "Customer", "Driver", "Items", "Price", "Status", "Date"].map(h => (
                      <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs">#{d.id}</td>
                      <td className="px-5 py-4 font-medium text-gray-800">{d.customerName}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {d.driverName || <span className="text-gray-300">Unassigned</span>}
                      </td>
                      <td className="px-5 py-4 text-gray-500 max-w-32 truncate">{d.itemDescription}</td>
                      <td className="px-5 py-4 font-medium text-gray-800">{d.price} DA</td>
                      <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}