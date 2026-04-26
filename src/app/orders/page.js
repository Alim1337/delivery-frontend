"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: "", deliveryAddress: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [ordersRes, customersRes, driversRes] = await Promise.all([
        api.get("/api/orders?page=0&size=50"),
        api.get("/api/customers"),
        api.get("/api/drivers"),
      ]);
      setOrders(ordersRes.data.content);
      setCustomers(customersRes.data);
      setDrivers(driversRes.data);
    } catch { router.push("/login"); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/orders", {
        customerId: parseInt(form.customerId),
        deliveryAddress: form.deliveryAddress,
      });
      setForm({ customerId: "", deliveryAddress: "" });
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create order");
    }
  };

  const handleAssignDriver = async (orderId, driverId) => {
    try {
      await api.patch(`/api/orders/${orderId}/assign?driverId=${driverId}`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to assign driver");
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  const availableDrivers = drivers.filter(d => d.available);
  const statuses = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
            {showForm ? "Cancel" : "+ New Order"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-2 gap-4">
            {error && <p className="col-span-2 text-red-500 text-sm">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                required>
                <option value="">Select customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm">
                Place Order
              </button>
            </div>
          </form>
        )}

        {loading ? <p className="text-gray-500">Loading...</p> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  {["ID", "Customer", "Driver", "Address", "Status", "Assign Driver", "Update Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{o.id}</td>
                    <td className="px-4 py-3 font-medium">{o.customerName}</td>
                    <td className="px-4 py-3">{o.driverName || <span className="text-gray-400">Unassigned</span>}</td>
                    <td className="px-4 py-3">{o.deliveryAddress}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      {o.status === "PENDING" && availableDrivers.length > 0 && (
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          defaultValue=""
                          onChange={(e) => e.target.value && handleAssignDriver(o.id, e.target.value)}>
                          <option value="">Assign...</option>
                          {availableDrivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {o.status !== "DELIVERED" && o.status !== "CANCELLED" && (
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={o.status}
                          onChange={(e) => handleStatusUpdate(o.id, e.target.value)}>
                          {statuses.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <p className="text-center text-gray-400 py-8">No orders yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}