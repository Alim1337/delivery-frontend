"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Search } from "lucide-react";

const links = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/new-delivery", label: "New Delivery" },
  { href: "/business/profile", label: "Profile" },
];

export default function NewDeliveryPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    customerId: "", pickupAddress: "",
    dropoffAddress: "", itemDescription: "", price: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/users/customers")
      .then(res => setCustomers(res.data))
      .catch(() => toast.error("Failed to load customers"));
}, []);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === parseInt(form.customerId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) { toast.error("Please select a customer"); return; }
    setLoading(true);
    try {
      await api.post("/api/deliveries", {
        ...form,
        customerId: parseInt(form.customerId),
        price: parseFloat(form.price),
      });
      toast.success("Delivery request created!");
      router.push("/business/dashboard");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length > 0) errors.forEach(e => toast.error(e));
      else toast.error(err.response?.data?.error || "Failed to create delivery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-2xl mx-auto p-6">
        <button onClick={() => router.push("/business/dashboard")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-6">New Delivery Request</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Customer selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {selectedCustomer && (
                <div className="mb-2 p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm">
                  ✓ Selected: <strong>{selectedCustomer.name}</strong> — {selectedCustomer.email}
                </div>
              )}
              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y">
                {filtered.length === 0 ? (
                  <p className="p-3 text-sm text-gray-400 text-center">No customers found</p>
                ) : filtered.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => setForm({ ...form, customerId: c.id.toString() })}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition ${
                      form.customerId === c.id.toString() ? "bg-purple-50" : ""
                    }`}>
                    <span className="font-medium text-gray-800">{c.name}</span>
                    <span className="text-gray-400 ml-2">{c.email}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { key: "pickupAddress", label: "Pickup Address", placeholder: "Where to pick up from" },
                { key: "dropoffAddress", label: "Delivery Address", placeholder: "Where to deliver to" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    required
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
              <textarea
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="What's being delivered? e.g. 2 boxes of clothes"
                rows={3}
                value={form.itemDescription}
                onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Price (DA)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="500"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50">
              {loading ? "Creating..." : "Create Delivery Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}