"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ customers: 0, drivers: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

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
        toast.error("Failed to load dashboard data");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;

  const cards = [
    { label: "Total Customers", value: stats.customers, color: "bg-blue-500", link: "/customers" },
    { label: "Total Drivers", value: stats.drivers, color: "bg-green-500", link: "/drivers" },
    { label: "Total Orders", value: stats.orders, color: "bg-purple-500", link: "/orders" },
  ];

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          {role && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              role === "ADMIN"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {role}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card) => (
              <a href={card.link} key={card.label}
                className={`${card.color} text-white rounded-xl p-6 shadow hover:opacity-90 transition`}>
                <p className="text-sm opacity-80">{card.label}</p>
                <p className="text-4xl font-bold mt-2">{card.value}</p>
                <p className="text-xs opacity-60 mt-2">Click to view →</p>
              </a>
            ))}
          </div>
        )}

        {role === "ADMIN" && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm font-medium">
              ⚡ You are logged in as ADMIN — you have full access including delete permissions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}