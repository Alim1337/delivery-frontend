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

const iconColorMap = {
  blue:   "text-blue-600 bg-blue-100",
  green:  "text-emerald-600 bg-emerald-100",
  purple: "text-purple-600 bg-purple-100",
};

const hoverBorderMap = {
  blue:   "hover:border-blue-300 hover:bg-blue-50/50",
  green:  "hover:border-emerald-300 hover:bg-emerald-50/50",
  purple: "hover:border-purple-300 hover:bg-purple-50/50",
};

const chevronHoverMap = {
  blue:   "group-hover:text-blue-500",
  green:  "group-hover:text-emerald-500",
  purple: "group-hover:text-purple-500",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", email: "", password: "",
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
      if (errors?.length > 0) errors.forEach((e) => toast.error(e));
      else toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors duration-150 bg-gray-50/50";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Logo ── */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-lg mb-3 p-3">
            <Truck className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">DeliverFlow</h1>
          <p className="text-blue-200 text-sm mt-1">Create your account</p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-blue-900/20 p-6 md:p-8">

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s <= step ? "bg-blue-600" : "bg-gray-100"
                }`}
              />
            ))}
          </div>

          {/* ── Step 1: Role selection ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">I am a...</h2>
              <p className="text-gray-400 text-sm mb-5">Choose how you'll use DeliverFlow</p>
              <div className="space-y-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className={`w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl transition-all duration-200 group text-left active:scale-[0.98] ${hoverBorderMap[role.color]}`}
                    >
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconColorMap[role.color]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{role.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{role.description}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-all duration-200 group-hover:translate-x-0.5 ${chevronHoverMap[role.color]}`} />
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* ── Step 2: Details form ── */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors duration-150 -ml-1 px-1 py-0.5 rounded-lg hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Back
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Your details</h2>
              <p className="text-gray-400 text-sm mb-5">
                Registering as{" "}
                <span className="font-semibold text-blue-600">{selectedRole}</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">First name</label>
                    <input
                      className={inputClass}
                      placeholder="John"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Last name</label>
                    <input
                      className={inputClass}
                      placeholder="Doe"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone</label>
                  <input
                    className={inputClass}
                    placeholder="0555 123 456"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      className={`${inputClass} pr-11 ${
                        form.password.length > 0 && form.password.length < 6
                          ? "border-red-300 focus:ring-red-400"
                          : ""
                      }`}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150 p-1 -mr-1"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.password.length > 0 && form.password.length < 6 && (
                    <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
                      {form.password.length}/6 characters minimum
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-300 hover:-translate-y-px active:translate-y-0 mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : "Create account"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
