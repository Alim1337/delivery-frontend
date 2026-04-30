"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { User, Save, Package, Star } from "lucide-react";

const links = [
  { href: "/customers/dashboard", label: "My Deliveries" },
  { href: "/customers/profile", label: "Profile" },
];

export default function CustomerProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "CUSTOMER") { router.push("/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [userRes, deliveriesRes] = await Promise.all([
        api.get("/api/users/me"),
        api.get("/api/deliveries/my-deliveries").catch(() => ({ data: [] })),
      ]);
      setUser(userRes.data);
      setForm({
        firstName: userRes.data.firstName || "",
        lastName: userRes.data.lastName || "",
        phone: userRes.data.phone || "",
      });
      setDeliveries(deliveriesRes.data);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/api/users/me", form);
      localStorage.setItem("firstName", res.data.firstName);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const totalDeliveries = deliveries.filter(d => d.status === "DELIVERED").length;
  const rated = deliveries.filter(d => d.rating);
  const avgRating = rated.length > 0
    ? (rated.reduce((s, d) => s + d.rating, 0) / rated.length).toFixed(1)
    : null;

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar links={links} />
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your account settings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalDeliveries}</p>
            <p className="text-xs text-gray-500">Deliveries received</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{avgRating || "—"}</p>
            <p className="text-xs text-gray-500">Avg rating given</p>
          </div>
        </div>

        {/* Profile form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Personal Information</h2>
              <p className="text-xs text-gray-400">Update your account details</p>
            </div>
          </div>
          <form onSubmit={handleSave} className="p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "firstName", label: "First name" },
                { key: "lastName", label: "Last name" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    required
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                value={user?.email || ""}
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}