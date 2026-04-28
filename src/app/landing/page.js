"use client";
import Link from "next/link";
import { Truck, Package, MapPin, Star, Building2, User, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-800 text-lg">DeliverFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/track/DLV-00000000"
            className="text-sm text-gray-600 hover:text-gray-800">
            Track Order
          </Link>
          <Link href="/login"
            className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition">
            Sign in
          </Link>
          <Link href="/register"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
          Live delivery tracking
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Deliver smarter,<br />
          <span className="text-blue-600">track in real time</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Connect businesses, drivers, and customers on one platform.
          From pickup to doorstep — fully transparent.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition text-lg">
            Start for free
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link href="/track/DLV-00000000"
            className="flex items-center gap-2 text-gray-600 px-6 py-3 rounded-xl font-medium border border-gray-200 hover:border-gray-300 transition text-lg">
            <Package className="w-5 h-5" />
            Track a package
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            One platform, three roles
          </h2>
          <p className="text-center text-gray-500 mb-12">Everyone gets exactly what they need</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                color: "purple",
                title: "Business",
                desc: "Create delivery requests, assign customers, track all your shipments in one dashboard.",
                features: ["Create deliveries", "Track in real time", "Share tracking links"],
              },
              {
                icon: Truck,
                color: "green",
                title: "Driver",
                desc: "See available deliveries near you, accept jobs, and update status on the go.",
                features: ["See available jobs", "Accept deliveries", "Update status live"],
              },
              {
                icon: User,
                color: "blue",
                title: "Customer",
                desc: "Receive deliveries and track them in real time. No account needed with a tracking code.",
                features: ["Track without login", "Live status updates", "Rate your driver"],
              },
            ].map((card) => {
              const Icon = card.icon;
              const colors = {
                purple: { bg: "bg-purple-50", text: "text-purple-600", dot: "bg-purple-400" },
                green: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-400" },
                blue: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
              };
              const c = colors[card.color];
              return (
                <div key={card.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{card.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">{card.desc}</p>
                  <ul className="space-y-2">
                    {card.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
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

      {/* Track section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 text-center text-white">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-3">Track any delivery</h2>
          <p className="text-blue-200 mb-8">No account needed. Just enter your tracking code.</p>
          <Link href="/track/DLV-00000000"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition">
            <Package className="w-5 h-5" />
            Try tracking
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
            <Truck className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-gray-600">DeliverFlow</span>
        </div>
        <p>Built with Spring Boot + Next.js</p>
      </footer>
    </div>
  );
}