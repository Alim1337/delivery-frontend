"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft, Search, Package, User,
  Mail, Phone, UserCheck, AlertCircle
} from "lucide-react";

const links = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/new-delivery", label: "New Delivery" },
  { href: "/business/profile", label: "Profile" },
];

const RECIPIENT_TYPES = [
  {
    id: "REGISTERED",
    icon: UserCheck,
    title: "Registered Customer",
    description: "Select an existing customer from the platform",
    color: "blue",
  },
  {
    id: "EMAIL_ONLY",
    icon: Mail,
    title: "Send via Email",
    description: "Enter customer email — we'll send them the tracking code automatically",
    color: "green",
  },
  {
    id: "MANUAL",
    icon: Phone,
    title: "Manual Share",
    description: "You'll share the tracking code yourself (WhatsApp, SMS, etc.)",
    color: "purple",
  },
];

export default function NewDeliveryPage() {
  const router = useRouter();
  const [recipientType, setRecipientType] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    pickupAddress: "",
    dropoffAddress: "",
    itemDescription: "",
    price: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "BUSINESS") { router.push("/login"); return; }

    api.get("/api/users/customers")
      .then(res => setCustomers(res.data))
      .catch(() => {})
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

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    // Validation
    if (!recipientType) { toast.error("Please select a recipient type"); return; }
    if (!form.pickupAddress.trim()) { toast.error("Pickup address is required"); return; }
    if (!form.dropoffAddress.trim()) { toast.error("Delivery address is required"); return; }
    if (!form.itemDescription.trim()) { toast.error("Item description is required"); return; }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error("Enter a valid price"); return; }

    if (recipientType === "REGISTERED" && !form.customerId) {
      toast.error("Please select a customer"); return;
    }
    if (recipientType === "EMAIL_ONLY") {
      if (!form.recipientEmail.trim()) { toast.error("Recipient email is required"); return; }
      if (!/\S+@\S+\.\S+/.test(form.recipientEmail)) { toast.error("Enter a valid email address"); return; }
    }

    setLoading(true);
    try {
      const payload = {
        recipientType,
        pickupAddress: form.pickupAddress,
        dropoffAddress: form.dropoffAddress,
        itemDescription: form.itemDescription,
        price: parseFloat(form.price),
      };

      if (recipientType === "REGISTERED") {
        payload.customerId = parseInt(form.customerId);
      } else {
        payload.recipientName = form.recipientName;
        payload.recipientPhone = form.recipientPhone;
        payload.recipientEmail = form.recipientEmail;
      }

      const res = await api.post("/api/deliveries", payload);
      const trackingCode = res.data.trackingCode;

      if (recipientType === "MANUAL") {
        // Show tracking code prominently for manual sharing
        toast.success(
          `Delivery created! Tracking code: ${trackingCode}`,
          { duration: 8000 }
        );
      } else if (recipientType === "EMAIL_ONLY") {
        toast.success(`Delivery created! Tracking code sent to ${form.recipientEmail}`);
      } else {
        toast.success("Delivery created! Customer has been notified.");
      }

      router.push("/business/dashboard");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length > 0) errors.forEach(e => toast.error(e));
      else toast.error(err.response?.data?.error || "Failed to create delivery");
    } finally {
      setLoading(false);
    }
  };

  const colorMap = {
    blue:   { border: "border-blue-500 bg-blue-50", icon: "bg-blue-100 text-blue-600", text: "text-blue-700" },
    green:  { border: "border-green-500 bg-green-50", icon: "bg-green-100 text-green-600", text: "text-green-700" },
    purple: { border: "border-purple-500 bg-purple-50", icon: "bg-purple-100 text-purple-600", text: "text-purple-700" },
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
              <p className="text-xs text-gray-400">Fill in the delivery details</p>
            </div>
          </div>

          <div className="p-4 md:p-5 space-y-6">

            {/* Step 1 — Recipient type */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <h2 className="font-semibold text-gray-800 text-sm">How will you reach the customer?</h2>
              </div>

              <div className="space-y-2">
                {RECIPIENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const c = colorMap[type.color];
                  const selected = recipientType === type.id;
                  return (
                    <button key={type.id} type="button"
                      onClick={() => setRecipientType(type.id)}
                      className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl transition text-left ${
                        selected
                          ? c.border
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        selected ? c.icon : "bg-gray-100 text-gray-500"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${selected ? c.text : "text-gray-800"}`}>
                          {type.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                        selected ? "border-current bg-current" : "border-gray-300"
                      } ${selected ? c.text : ""}`}>
                        {selected && (
                          <div className="w-full h-full rounded-full bg-white scale-50 transform" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2 — Recipient details (conditional) */}
            {recipientType && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                  <h2 className="font-semibold text-gray-800 text-sm">
                    {recipientType === "REGISTERED" ? "Select customer" :
                     recipientType === "EMAIL_ONLY" ? "Customer details" :
                     "Customer info (optional)"}
                  </h2>
                </div>

                {/* REGISTERED — search existing customers */}
                {recipientType === "REGISTERED" && (
                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                            updateForm("customerId", "");
                          }
                          setSearchFocused(true);
                        }}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                        autoComplete="off"
                      />
                    </div>

                    {selectedCustomer && !searchFocused && (
                      <div className="mt-2 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                          {selectedCustomer.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-800">{selectedCustomer.name}</p>
                          <p className="text-xs text-blue-500">{selectedCustomer.email}</p>
                        </div>
                        <button type="button"
                          onClick={() => { updateForm("customerId", ""); setSearch(""); }}
                          className="text-blue-400 hover:text-blue-600 text-xs font-medium">
                          ✕ Clear
                        </button>
                      </div>
                    )}

                    {searchFocused && (
                      <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white max-h-44 overflow-y-auto">
                        {loadingCustomers ? (
                          <div className="p-4 text-center text-sm text-gray-400">Loading...</div>
                        ) : filtered.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-400">
                            {customers.length === 0 ? "No registered customers yet" : "No match found"}
                          </div>
                        ) : filtered.map(c => (
                          <button key={c.id} type="button"
                            onMouseDown={() => selectCustomer(c)}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition border-b border-gray-50 last:border-0 ${
                              form.customerId === c.id.toString() ? "bg-blue-50" : ""
                            }`}>
                            <p className="font-medium text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.email} · {c.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* EMAIL_ONLY — enter email + optional name/phone */}
                {recipientType === "EMAIL_ONLY" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-green-700">
                        We'll send an email with the tracking code and a link. No account needed for the recipient.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Recipient Email <span className="text-red-400">*</span>
                      </label>
                      <input type="email"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50"
                        placeholder="customer@example.com"
                        value={form.recipientEmail}
                        onChange={(e) => updateForm("recipientEmail", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Name (optional)</label>
                        <input
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50"
                          placeholder="John Doe"
                          value={form.recipientName}
                          onChange={(e) => updateForm("recipientName", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone (optional)</label>
                        <input
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50/50"
                          placeholder="0555 123 456"
                          value={form.recipientPhone}
                          onChange={(e) => updateForm("recipientPhone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MANUAL — optional info + clear message */}
                {recipientType === "MANUAL" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                      <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-purple-700">
                        After creating the delivery, you'll see the tracking code in your dashboard. Share it with your customer via WhatsApp, SMS, or any other way.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name (optional)</label>
                        <input
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                          placeholder="John Doe"
                          value={form.recipientName}
                          onChange={(e) => updateForm("recipientName", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone (optional)</label>
                        <input
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                          placeholder="0555 123 456"
                          value={form.recipientPhone}
                          onChange={(e) => updateForm("recipientPhone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 — Delivery details */}
            {recipientType && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                  <h2 className="font-semibold text-gray-800 text-sm">Delivery details</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pickup Address <span className="text-red-400">*</span>
                    </label>
                    <input type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                      placeholder="Where to pick up from"
                      value={form.pickupAddress}
                      onChange={(e) => updateForm("pickupAddress", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Delivery Address <span className="text-red-400">*</span>
                    </label>
                    <input type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                      placeholder="Where to deliver to"
                      value={form.dropoffAddress}
                      onChange={(e) => updateForm("dropoffAddress", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Item Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50 resize-none"
                      placeholder="What's being delivered? e.g. 2 boxes of clothes"
                      rows={3}
                      value={form.itemDescription}
                      onChange={(e) => updateForm("itemDescription", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Delivery Price (DA) <span className="text-red-400">*</span>
                    </label>
                    <input type="number" min="0" step="0.01"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                      placeholder="500"
                      value={form.price}
                      onChange={(e) => updateForm("price", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            {recipientType && (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  recipientType === "EMAIL_ONLY"
                    ? "Create & Send Email 📧"
                    : recipientType === "MANUAL"
                    ? "Create & Get Tracking Code 📋"
                    : "Create Delivery 🚀"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}