"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Building2 } from "lucide-react";

export default function BusinessSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "", businessAddress: "", businessPhone: "", description: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/profile/business", form);
      toast.success("Business profile created!");
      router.push("/business/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Setup your business</h1>
          <p className="text-gray-500 text-sm mt-1">Tell customers about your business</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: "businessName", label: "Business name", placeholder: "My Store" },
            { key: "businessAddress", label: "Business address", placeholder: "123 Main St, Algiers" },
            { key: "businessPhone", label: "Business phone (optional)", placeholder: "0555 000 000" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                required={f.key !== "businessPhone"}
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Tell customers what you sell..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50">
            {loading ? "Saving..." : "Launch my business →"}
          </button>
        </form>
      </div>
    </div>
  );
}