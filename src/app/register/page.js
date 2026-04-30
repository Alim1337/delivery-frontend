"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { Truck, User, Building2, ChevronRight, Eye, EyeOff } from "lucide-react";

const roles = [
  {
    id: "CUSTOMER",
    icon: User,
    title: "Customer",
    description: "I want to receive deliveries and track my orders",
    color: "blue",
  },
  {
    id: "DRIVER",
    icon: Truck,
    title: "Driver",
    description: "I want to deliver packages and earn money",
    color: "green",
  },
  {
    id: "BUSINESS",
    icon: Building2,
    title: "Business",
    description: "I need drivers to deliver my products to customers",
    color: "purple",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", email: "", password: ""
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", { ...form, role: selectedRole });
      const { token, role, firstName } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("firstName", firstName);
      toast.success(`Welcome, ${firstName}!`);
      if (role === "BUSINESS") router.push("/business/setup");
      else if (role === "DRIVER") router.push("/drivers/setup");
      else router.push("/customers/dashboard");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length > 0) errors.forEach(e => toast.error(e));
      else toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const colorMap = {
    blue:   { border: "border-blue-500 bg-blue-50", icon: "text-blue-600 bg-blue-100" },
    green:  { border: "border-green-500 bg-green-50", icon: "text-green-600 bg-green-100" },
    purple: { border: "border-purple-500 bg-purple-50", icon: "text-purple-600 bg-purple-100" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg mb-3 p-3">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">DeliverFlow</h1>
          <p className="text-blue-200 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? "bg-blue-600" : "bg-gray-200"}`} />
            ))}
          </div>

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">I am a...</h2>
              <p className="text-gray-500 text-sm mb-5">Choose how you'll use DeliverFlow</p>
              <div className="space-y-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const c = colorMap[role.color];
                  return (
                    <button key={role.id} onClick={() => handleRoleSelect(role.id)}
                      className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition group text-left">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.icon} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800">{role.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-sm text-gray-500 mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
                ← Back
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Your details</h2>
              <p className="text-gray-500 text-sm mb-5">
                Registering as{" "}
                <span className="font-medium text-blue-600">{selectedRole}</span>
              </p>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "firstName", placeholder: "John", label: "First name" },
                    { key: "lastName", placeholder: "Doe", label: "Last name" },
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
                </div>
                {[
                  { key: "phone", placeholder: "0555 123 456", label: "Phone", type: "tel" },
                  { key: "email", placeholder: "you@example.com", label: "Email", type: "email" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      required
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      className={`w-full px-3 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 ${
                        form.password.length > 0 && form.password.length < 6
                          ? "border-red-300"
                          : "border-gray-200"
                      }`}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password.length > 0 && form.password.length < 6 && (
                    <p className="text-red-500 text-xs mt-1">{form.password.length}/6 characters</p>
                  )}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50 mt-1">
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}