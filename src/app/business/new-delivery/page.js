"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Search, Package } from "lucide-react";

const links = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/new-delivery", label: "New Delivery" },
  { href: "/business/profile", label: "Profile" },
];

export default function NewDeliveryPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    pickupAddress: "",
    dropoffAddress: "",
    itemDescription: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "BUSINESS") { router.push("/login"); return; }

    api.get("/api/users/customers")
      .then(res => setCustomers(res.data))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoadingCustomers(false));
  }, []);

  const filtered = customers.filter(c =>
    search === "" ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === parseInt(form.customerId));

  const selectCustomer = (customer) => {
    setForm(prev => ({ ...prev, customerId: customer.id.toString() }));
    setSearch(customer.name);
    setSearchFocused(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) { toast.error("Please select a customer"); return; }
    if (!form.pickupAddress.trim()) { toast.error("Pickup address is required"); return; }
    if (!form.dropoffAddress.trim()) { toast.error("Delivery address is required"); return; }
    if (!form.itemDescription.trim()) { toast.error("Item description is required"); return; }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error("Enter a valid price"); return; }

    setLoading(true);
    try {
      await api.post("/api/deliveries", {
        customerId: parseInt(form.customerId),
        pickupAddress: form.pickupAddress,
        dropoffAddress: form.dropoffAddress,
        itemDescription: form.itemDescription,
        price: parseFloat(form.price),
      });
      toast.success("Delivery request created! 🚀");
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
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <button onClick={() => router.push("/business/dashboard")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">New Delivery Request</h1>
              <p className="text-xs text-gray-400">Fill in the delivery details below</p>
            </div>
          </div>

          <div className="p-4 md:p-5 space-y-5">

            {/* Customer selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer <span className="text-red-400">*</span>
              </label>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    // Clear selection if user is typing again
                    if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                      setForm(prev => ({ ...prev, customerId: "" }));
                    }
                    setSearchFocused(true);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  autoComplete="off"
                />
              </div>

              {/* Selected customer badge */}
              {selectedCustomer && !searchFocused && (
                <div className="mt-2 flex items-center gap-2 p-2.5 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">
                    {selectedCustomer.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-purple-800">{selectedCustomer.name}</p>
                    <p className="text-xs text-purple-500">{selectedCustomer.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ ...prev, customerId: "" }));
                      setSearch("");
                    }}
                    className="text-purple-400 hover:text-purple-600 text-xs">
                    ✕ Clear
                  </button>
                </div>
              )}

              {/* Dropdown list */}
              {searchFocused && (
                <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white max-h-44 overflow-y-auto">
                  {loadingCustomers ? (
                    <div className="p-4 text-center text-sm text-gray-400">Loading customers...</div>
                  ) : filtered.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">
                      {customers.length === 0
                        ? "No customers registered yet"
                        : "No customers match your search"}
                    </div>
                  ) : filtered.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => selectCustomer(c)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition border-b border-gray-50 last:border-0 ${
                        form.customerId === c.id.toString() ? "bg-purple-50" : ""
                      }`}>
                      <p className="font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email} · {c.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Pickup Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                  placeholder="Where to pick up from"
                  value={form.pickupAddress}
                  onChange={(e) => setForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Delivery Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                  placeholder="Where to deliver to"
                  value={form.dropoffAddress}
                  onChange={(e) => setForm(prev => ({ ...prev, dropoffAddress: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Item Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50 resize-none"
                  placeholder="What's being delivered? e.g. 2 boxes of clothes"
                  rows={3}
                  value={form.itemDescription}
                  onChange={(e) => setForm(prev => ({ ...prev, itemDescription: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Delivery Price (DA) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                  placeholder="500"
                  value={form.price}
                  onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating...
                </span>
              ) : "Create Delivery Request 🚀"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}