"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await api.get("/api/drivers");
      setDrivers(res.data);
    } catch { router.push("/login"); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/drivers", { ...form, available: true });
      setForm({ name: "", phone: "" });
      setShowForm(false);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create driver");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Drivers</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
            {showForm ? "Cancel" : "+ Add Driver"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-2 gap-4">
            {error && <p className="col-span-2 text-red-500 text-sm">{error}</p>}
            {["name", "phone"].map((field) => (
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
                Create Driver
              </button>
            </div>
          </form>
        )}

        {loading ? <p className="text-gray-500">Loading...</p> : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  {["ID", "Name", "Phone", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{d.id}</td>
                    <td className="px-4 py-3 font-medium">{d.name}</td>
                    <td className="px-4 py-3">{d.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${d.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {d.available ? "Available" : "Busy"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {drivers.length === 0 && (
              <p className="text-center text-gray-400 py-8">No drivers yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}