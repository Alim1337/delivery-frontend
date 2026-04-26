"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("role") === "ADMIN";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/api/customers");
      setCustomers(res.data);
    } catch { router.push("/login"); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/customers", form);
      setForm({ name: "", email: "", phone: "", address: "" });
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create customer");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await api.delete(`/api/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
            {showForm ? "Cancel" : "+ Add Customer"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-2 gap-4">
            {error && <p className="col-span-2 text-red-500 text-sm">{error}</p>}
            {["name", "email", "phone", "address"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required
                />
              </div>
            ))}
            <div className="col-span-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm">
                Create Customer
              </button>
            </div>
          </form>
        )}

        {loading ? <p className="text-gray-500">Loading...</p> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  {["ID", "Name", "Email", "Phone", "Address", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{c.id}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">{c.phone}</td>
                    <td className="px-4 py-3">{c.address}</td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {customers.length === 0 && (
              <p className="text-center text-gray-400 py-8">No customers yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}