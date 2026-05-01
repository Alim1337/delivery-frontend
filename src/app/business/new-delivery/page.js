"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Search, User, UserPlus, UserX, Copy, CheckCircle } from "lucide-react";

const links = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/new-delivery", label: "New Delivery" },
  { href: "/business/profile", label: "Profile" },
];

const recipientModes = [
  {
    id: "registered",
    icon: User,
    label: "Registered Customer",
    desc: "Select someone already on DeliverFlow",
    color: "blue",
  },
  {
    id: "manual",
    icon: UserPlus,
    label: "New Recipient",
    desc: "Enter their name, email or phone",
    color: "green",
  },
  {
    id: "none",
    icon: UserX,
    label: "No Recipient",
    desc: "You'll share the tracking code yourself",
    color: "gray",
  },
];

export default function NewDeliveryPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [recipientMode, setRecipientMode] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [recipientForm, setRecipientForm] = useState({
    recipientName: "", recipientEmail: "", recipientPhone: ""
  });
  const [form, setForm] = useState({
    pickupAddress: "", dropoffAddress: "", itemDescription: "", price: ""
  });
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null); // tracking code after creation

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "BUSINESS") { router.push("/login"); return; }
    api.get("/api/users/customers")
      .then(res => setCustomers(res.data))
      .catch(() => {});
  }, []);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id === parseInt(selectedCustomerId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (recipientMode === "registered" && !selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
      };

      if (recipientMode === "registered") {
        payload.customerId = parseInt(selectedCustomerId);
      } else if (recipientMode === "manual") {
        payload.recipientName = recipientForm.recipientName;
        payload.recipientEmail = recipientForm.recipientEmail;
        payload.recipientPhone = recipientForm.recipientPhone;
      }
      // if "none" — no recipient fields sent

      const res = await api.post("/api/deliveries", payload);
      setCreated(res.data);
      toast.success("Delivery created!");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length > 0) errors.forEach(e => toast.error(e));
      else toast.error(err.response?.data?.error || "Failed to create delivery");
    } finally {
      setLoading(false);
    }
  };

  const colorMap = {
    blue: { border: "border-blue-500 bg-blue-50", icon: "bg-blue-100 text-blue-600" },
    green: { border: "border-green-500 bg-green-50", icon: "bg-green-100 text-green-600" },
    gray: { border: "border-gray-400 bg-gray-50", icon: "bg-gray-100 text-gray-600" },
  };

  // Success screen after creation
  if (created) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar links={links} />
        <div className="max-w-lg mx-auto p-4 md:p-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delivery Created!</h2>
            <p className="text-gray-500 text-sm mb-6">Share this tracking code with the recipient</p>

            {/* Tracking code */}
            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">
                Tracking Code
              </p>
              <p className="text-3xl font-bold font-mono text-gray-800 tracking-wider mb-3">
                {created.trackingCode}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(created.trackingCode);
                    toast.success("Code copied!");
                  }}
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
                  <Copy className="w-4 h-4" />
                  Copy Code
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/track/${created.trackingCode}`
                    );
                    toast.success("Link copied!");
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition">
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
            </div>

            {/* Delivery summary */}
            <div className="text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Item</span>
                <span className="text-gray-700 font-medium">{created.itemDescription}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Recipient</span>
                <span className="text-gray-700 font-medium">
                  {created.customerName || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price</span>
                <span className="text-gray-700 font-medium">{created.price} DA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className="text-yellow-600 font-medium">Waiting for driver</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCreated(null);
                  setRecipientMode(null);
                  setSelectedCustomerId("");
                  setRecipientForm({ recipientName: "", recipientEmail: "", recipientPhone: "" });
                  setForm({ pickupAddress: "", dropoffAddress: "", itemDescription: "", price: "" });
                }}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
                New Delivery
              </button>
              <button
                onClick={() => router.push("/business/dashboard")}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <button onClick={() => router.push("/business/dashboard")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-1">New Delivery Request</h1>
          <p className="text-gray-500 text-sm mb-6">Fill in the details to create a delivery</p>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Step 1 — Recipient */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
                Who is receiving this delivery?
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {recipientModes.map((mode) => {
                  const Icon = mode.icon;
                  const c = colorMap[mode.color];
                  const selected = recipientMode === mode.id;
                  return (
                    <button key={mode.id} type="button"
                      onClick={() => setRecipientMode(mode.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition ${
                        selected ? c.border : "border-gray-100 hover:border-gray-200"
                      }`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        selected ? c.icon : "bg-gray-100 text-gray-400"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{mode.label}</p>
                        <p className="text-xs text-gray-400">{mode.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Registered customer selector */}
              {recipientMode === "registered" && (
                <div className="mt-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  {selectedCustomer && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="font-medium text-blue-700">{selectedCustomer.name}</span>
                      <span className="text-blue-400">{selectedCustomer.email}</span>
                    </div>
                  )}
                  <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-xl divide-y bg-white">
                    {filtered.length === 0 ? (
                      <p className="p-3 text-sm text-gray-400 text-center">No customers found</p>
                    ) : filtered.map(c => (
                      <button key={c.id} type="button"
                        onClick={() => setSelectedCustomerId(c.id.toString())}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition ${
                          selectedCustomerId === c.id.toString() ? "bg-blue-50" : ""
                        }`}>
                        <span className="font-medium text-gray-800">{c.name}</span>
                        <span className="text-gray-400 ml-2 text-xs">{c.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual recipient */}
              {recipientMode === "manual" && (
                <div className="mt-3 space-y-3">
                  {[
                    { key: "recipientName", label: "Recipient name", placeholder: "Full name", required: false },
                    { key: "recipientEmail", label: "Email", placeholder: "email@example.com", required: false },
                    { key: "recipientPhone", label: "Phone", placeholder: "0555 000 000", required: false },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50"
                        placeholder={f.placeholder}
                        value={recipientForm[f.key]}
                        onChange={(e) => setRecipientForm({ ...recipientForm, [f.key]: e.target.value })}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">
                    💡 All fields are optional. You can share the tracking code with the recipient yourself.
                  </p>
                </div>
              )}

              {recipientMode === "none" && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500">
                    📋 A tracking code will be generated. Share it with your recipient however you prefer — WhatsApp, phone, in person.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2 — Delivery details */}
            {recipientMode && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                  Delivery details
                </h2>
                <div className="space-y-3">
                  {[
                    { key: "pickupAddress", label: "Pickup address", placeholder: "Where to pick up from" },
                    { key: "dropoffAddress", label: "Delivery address", placeholder: "Where to deliver to" },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        placeholder={f.placeholder}
                        value={form[f.key]}
                        onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        required
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Item description</label>
                    <textarea
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 resize-none"
                      placeholder="What's being delivered?"
                      rows={2}
                      value={form.itemDescription}
                      onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Delivery price (DA)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                      placeholder="500"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {recipientMode && (
              <button type="submit" disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50">
                {loading ? "Creating..." : "Create Delivery →"}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}