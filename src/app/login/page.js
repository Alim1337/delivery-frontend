"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { Truck, Mail, Lock, Eye, EyeOff, Package } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [trackCode, setTrackCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", form);
      const { token, role, firstName } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("firstName", firstName);
      toast.success(`Welcome back, ${firstName}!`);
      if (role === "BUSINESS") router.push("/business/dashboard");
      else if (role === "DRIVER") router.push("/drivers/dashboard");
      else if (role === "CUSTOMER") router.push("/customers/dashboard");
      else router.push("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackCode.trim()) {
      router.push(`/track/${trackCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Logo */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-13 h-13 bg-white rounded-2xl shadow-lg mb-3 p-3">
            <Truck className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">DeliverFlow</h1>
          <p className="text-blue-200 text-sm mt-1">Smart delivery management</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-blue-900/20 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Sign in</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors bg-gray-50/50"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors bg-gray-50/50"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200 hover:-translate-y-px active:translate-y-0 mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        {/* Track without login */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-white text-sm font-medium">Track a package without signing in</p>
          </div>
          <form onSubmit={handleTrack} className="flex gap-2">
            <input
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/60 placeholder-gray-400 text-gray-800 font-medium tracking-wide"
              placeholder="DLV-XXXXXXXX"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
            />
            <button type="submit"
              className="bg-white text-blue-600 font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition-all text-sm whitespace-nowrap">
              Track
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}