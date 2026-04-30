"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { Building2, Save, User } from "lucide-react";

const links = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/new-delivery", label: "New Delivery" },
  { href: "/business/profile", label: "Profile" },
];

export default function BusinessProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [businessForm, setBusinessForm] = useState({
    businessName: "", businessAddress: "", businessPhone: "", description: ""
  });
  const [savingUser, setSavingUser] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "BUSINESS") { router.push("/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [userRes, businessRes] = await Promise.all([
        api.get("/api/users/me"),
        api.get("/api/profile/business").catch(() => ({ data: null })),
      ]);
      setUser(userRes.data);
      setUserForm({
        firstName: userRes.data.firstName || "",
        lastName: userRes.data.lastName || "",
        phone: userRes.data.phone || "",
      });
      if (businessRes.data) {
        setBusiness(businessRes.data);
        setBusinessForm({
          businessName: businessRes.data.businessName || "",
          businessAddress: businessRes.data.businessAddress || "",
          businessPhone: businessRes.data.businessPhone || "",
          description: businessRes.data.description || "",
        });
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const res = await api.put("/api/users/me", userForm);
      localStorage.setItem("firstName", res.data.firstName);
      toast.success("Personal info updated!");
      fetchAll();
    } catch {
      toast.error("Failed to update info");
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    setSavingBusiness(true);
    try {
      await api.post("/api/profile/business", businessForm);
      toast.success("Business profile updated!");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update business");
    } finally {
      setSavingBusiness(false);
    }
  };

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
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Profile Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your personal and business information</p>
        </div>

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Personal Information</h2>
              <p className="text-xs text-gray-400">Your account details</p>
            </div>
          </div>
          <form onSubmit={handleSaveUser} className="p-4 md:p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "firstName", label: "First name" },
                { key: "lastName", label: "Last name" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                    value={userForm[f.key]}
                    onChange={(e) => setUserForm({ ...userForm, [f.key]: e.target.value })}
                    required
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
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
            <button type="submit" disabled={savingUser}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
              <Save className="w-4 h-4" />
              {savingUser ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Business info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Business Information</h2>
              <p className="text-xs text-gray-400">Shown to drivers and customers</p>
            </div>
          </div>
          <form onSubmit={handleSaveBusiness} className="p-4 md:p-5 space-y-4">
            {[
              { key: "businessName", label: "Business name", required: true },
              { key: "businessAddress", label: "Business address", required: true },
              { key: "businessPhone", label: "Business phone", required: false },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {f.label} {!f.required && <span className="text-gray-400">(optional)</span>}
                </label>
                <input
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                  value={businessForm[f.key]}
                  onChange={(e) => setBusinessForm({ ...businessForm, [f.key]: e.target.value })}
                  required={f.required}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50/50 resize-none"
                rows={3}
                placeholder="Tell customers what you sell..."
                value={businessForm.description}
                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
              />
            </div>
            <button type="submit" disabled={savingBusiness}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
              <Save className="w-4 h-4" />
              {savingBusiness ? "Saving..." : "Save Business Info"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}