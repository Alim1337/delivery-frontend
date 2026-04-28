"use client";
import Link from "next/link";
import { Truck, Package, MapPin, Building2, User, ChevronRight, Search, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [trackCode, setTrackCode] = useState("");
  const router = useRouter();

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackCode.trim()) {
      router.push(`/track/${trackCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="border-b border-gray-100/80 px-4 md:px-6 py-3.5 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 text-lg tracking-tight">DeliverFlow</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-150 shadow-sm shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-px"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-12 pb-8 md:pt-16 md:pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium mb-5 border border-blue-100 animate-fade-up">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          Live delivery tracking
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-5 leading-tight tracking-tight">
          Deliver smarter,{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            track in real time
          </span>
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
          Connect businesses, drivers, and customers on one platform.
          From pickup to doorstep — fully transparent.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 text-base shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-300 hover:-translate-y-0.5"
          >
            Start for free
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 px-6 py-3 rounded-xl font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 text-base"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Track package section (moved up, right after hero) ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12 md:pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 py-10 px-6 text-center shadow-xl shadow-blue-200">
          {/* decorative rings */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-indigo-500/20" />

          <div className="relative">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/20">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1.5">
              Track any delivery
            </h2>
            <p className="text-blue-200 mb-7 text-sm">
              No account needed. Just enter your tracking code.
            </p>
            <form onSubmit={handleTrack} className="flex gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/60 bg-white text-gray-800 placeholder-gray-400 tracking-wide transition-shadow duration-150"
                  placeholder="e.g. DLV-A8X3B2C1"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                />
              </div>
              <button
                type="submit"
                className="bg-white text-blue-600 font-semibold px-5 py-3 rounded-xl hover:bg-blue-50 transition-all duration-150 whitespace-nowrap hover:-translate-y-px hover:shadow-md"
              >
                Track
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-14 md:py-20 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-2 tracking-tight">
            One platform, three roles
          </h2>
          <p className="text-center text-gray-400 mb-10 text-sm">
            Everyone gets exactly what they need
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: Building2,
                color: "purple",
                title: "Business",
                desc: "Create delivery requests, assign customers, track all your shipments.",
                features: ["Create deliveries", "Track in real time", "Share tracking links"],
              },
              {
                icon: Truck,
                color: "green",
                title: "Driver",
                desc: "See available deliveries, accept jobs, and update status on the go.",
                features: ["Browse available jobs", "Accept deliveries", "Update status live"],
              },
              {
                icon: User,
                color: "blue",
                title: "Customer",
                desc: "Receive deliveries and track them live. No account needed with a tracking code.",
                features: ["Track without login", "Live status updates", "Rate your driver"],
              },
            ].map((card) => {
              const Icon = card.icon;
              const colors = {
                purple: {
                  bg: "bg-purple-50",
                  text: "text-purple-600",
                  dot: "bg-purple-400",
                  bar: "from-purple-500 to-violet-400",
                  ring: "group-hover:ring-purple-100",
                },
                green: {
                  bg: "bg-emerald-50",
                  text: "text-emerald-600",
                  dot: "bg-emerald-400",
                  bar: "from-emerald-500 to-teal-400",
                  ring: "group-hover:ring-emerald-100",
                },
                blue: {
                  bg: "bg-blue-50",
                  text: "text-blue-600",
                  dot: "bg-blue-400",
                  bar: "from-blue-500 to-indigo-400",
                  ring: "group-hover:ring-blue-100",
                },
              };
              const c = colors[card.color];
              return (
                <div
                  key={card.title}
                  className={`group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-gray-200 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 overflow-hidden`}
                >
                  {/* animated bottom bar */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.bar} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
                  />
                  <div
                    className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]`}
                  >
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">{card.desc}</p>
                  <ul className="space-y-2">
                    {card.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
            <Truck className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-600">DeliverFlow</span>
        </div>
        <p>Smart delivery management</p>
      </footer>
    </div>
  );
}