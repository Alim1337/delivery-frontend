"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import { Users, Truck, Package, Shield } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/customers", label: "Customers" },
  { href: "/drivers", label: "Drivers" },
  { href: "/orders", label: "Orders" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    customers: 0, drivers: 0, orders: 0, deliveries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) { router.push("/login"); return; }
    if (role !== "ADMIN") {
      if (role === "BUSINESS") router.push("/business/dashboard");
      else if (role === "DRIVER") router.push("/driver/dashboard");
      else if (role === "CUSTOMER") router.push("/customer/dashboard");
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [customers, drivers, orders] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/drivers"),
        api.get("/api/orders?page=0&size=1"),
      ]);
      setStats({
        customers: customers.data.length,
        drivers: drivers.data.length,
        orders: orders.data.totalElements,
      });
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: "Customers", value: stats.customers, icon: Users, color: "blue", href: "/customers" },
    { label: "Drivers", value: stats.drivers, icon: Truck, color: "green", href: "/drivers" },
    { label: "Orders", value: stats.orders, icon: Package, color: "purple", href: "/orders" },
  ];

  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", btn: "bg-blue-600" },
    green: { bg: "bg-green-50", text: "text-green-600", btn: "bg-green-600" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", btn: "bg-purple-600" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Full system access</p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cards.map((card) => {
              const Icon = card.icon;
              const c = colorMap[card.color];
              return (
                <a href={card.href} key={card.label}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{card.label}</p>
                  <p className={`text-xs mt-3 ${c.text} font-medium group-hover:underline`}>
                    Manage →
                  </p>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}