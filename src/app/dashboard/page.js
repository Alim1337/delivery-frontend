"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Customers", value: stats.customers, color: "bg-blue-500" },
    { label: "Total Drivers", value: stats.drivers, color: "bg-green-500" },
    { label: "Total Orders", value: stats.orders, color: "bg-purple-500" },
  ];

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card) => (
              <div key={card.label} className={`${card.color} text-white rounded-xl p-6 shadow`}>
                <p className="text-sm opacity-80">{card.label}</p>
                <p className="text-4xl font-bold mt-2">{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}