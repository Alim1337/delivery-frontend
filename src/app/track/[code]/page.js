"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import dynamic from "next/dynamic";
import {
  Truck, MapPin, Package, CheckCircle,
  Clock, XCircle, Search, Copy
} from "lucide-react";
import toast from "react-hot-toast";

// Dynamically import map to avoid SSR issues
const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-gray-100 rounded-2xl flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading map...</p>
    </div>
  ),
});

const statusSteps = [
  { key: "PENDING",    label: "Order Placed",    icon: Clock },
  { key: "ACCEPTED",   label: "Driver Assigned", icon: Truck },
  { key: "PICKED_UP",  label: "Picked Up",       icon: Package },
  { key: "ON_THE_WAY", label: "On The Way",      icon: MapPin },
  { key: "DELIVERED",  label: "Delivered",       icon: CheckCircle },
];

const statusColors = {
  PENDING:    "text-yellow-500",
  ACCEPTED:   "text-blue-500",
  PICKED_UP:  "text-indigo-500",
  ON_THE_WAY: "text-purple-500",
  DELIVERED:  "text-green-500",
  CANCELLED:  "text-red-500",
};

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (params?.code && params.code !== "DLV-00000000") {
      fetchDelivery(params.code);
      const interval = setInterval(() => fetchDelivery(params.code), 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [params?.code]);

  const fetchDelivery = async (code) => {
    try {
      const res = await api.get(`/api/deliveries/track/${code}`);
      setDelivery(res.data);
      setError(null);
    } catch {
      setError("No delivery found with this tracking code");
      setDelivery(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/track/${search.trim().toUpperCase()}`);
    }
  };

  const currentStep = delivery
    ? statusSteps.findIndex(s => s.key === delivery.status)
    : -1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-bold text-white">DeliverFlow</span>
          </a>
          <a href="/login"
            className="text-sm text-white/80 hover:text-white border border-white/30 px-4 py-1.5 rounded-lg transition">
            Sign in
          </a>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Track Your Delivery</h1>
          <p className="text-blue-200 text-sm">Enter your tracking code — no account needed</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none bg-white/95 text-gray-800 font-medium tracking-wide"
              placeholder="e.g. DLV-A8X3B2C1"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
            />
          </div>
          <button type="submit"
            className="bg-white text-blue-600 font-semibold px-5 py-3 rounded-xl hover:bg-blue-50 transition">
            Track
          </button>
        </form>

        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-xl">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading delivery info...</p>
          </div>

        ) : error ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-xl">
            <XCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">{error}</p>
            <p className="text-gray-400 text-sm mt-1">Double-check the code and try again</p>
          </div>

        ) : !delivery && !params?.code ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-xl">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Enter a tracking code above</p>
            <p className="text-gray-300 text-sm mt-1">You'll see live status and updates</p>
          </div>

        ) : delivery ? (
          <div className="space-y-4">
            {/* Main card */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xl">
              {/* Header */}
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-xs text-gray-400 font-mono mb-0.5">Tracking code</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-800 font-mono tracking-wider">
                      {delivery.trackingCode}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(delivery.trackingCode);
                        toast.success("Copied!");
                      }}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${statusColors[delivery.status]}`}>
                  {delivery.status?.replace(/_/g, " ")}
                </span>
              </div>

              {/* Progress */}
              {delivery.status !== "CANCELLED" ? (
                <div className="mb-5">
                  <div className="relative flex justify-between mb-3 z-10">
                    {statusSteps.map((step, i) => {
                      const Icon = step.icon;
                      const done = i <= currentStep;
                      const active = i === currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-1 flex-1">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                            done
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-200 text-gray-300"
                          } ${active ? "ring-4 ring-blue-100 scale-110" : ""}`}>
                            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </div>
                          <span className={`text-xs text-center hidden sm:block ${
                            done ? "text-blue-600 font-medium" : "text-gray-400"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative h-1.5 bg-gray-100 rounded-full -mt-8 md:-mt-9 mx-4 md:mx-5">
                    <div
                      className="absolute h-full bg-blue-600 rounded-full transition-all duration-700"
                      style={{
                        width: currentStep >= 0
                          ? `${(currentStep / (statusSteps.length - 1)) * 100}%`
                          : "0%"
                      }}
                    />
                  </div>
                  <div className="mt-6" />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl mb-5">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 font-medium text-sm">This delivery was cancelled</p>
                </div>
              )}

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Pickup from</p>
                    <p className="text-sm font-medium text-gray-700">{delivery.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Delivering to</p>
                    <p className="text-sm font-medium text-gray-700">{delivery.dropoffAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Package</p>
                    <p className="text-sm font-medium text-gray-700">{delivery.itemDescription}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map card */}
            <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xl">
              <p className="text-xs text-gray-400 uppercase font-medium mb-3">
                Delivery Route
              </p>
              <DeliveryMap
                pickupAddress={delivery.pickupAddress}
                dropoffAddress={delivery.dropoffAddress}
                status={delivery.status}
              />
            </div>

            {/* Driver card */}
            {delivery.driverName && (
              <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xl">
                <p className="text-xs text-gray-400 mb-3 uppercase font-medium">Your Driver</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{delivery.driverName}</p>
                    <p className="text-sm text-gray-500">{delivery.driverPhone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sender info */}
            <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xl">
              <p className="text-xs text-gray-400 uppercase font-medium mb-3">Sent by</p>
              <p className="font-semibold text-gray-800">{delivery.businessName}</p>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xl">
              <p className="text-xs text-gray-400 mb-4 uppercase font-medium">Timeline</p>
              <div className="space-y-3">
                {[
                  { label: "Order placed",      time: delivery.createdAt },
                  { label: "Driver accepted",   time: delivery.acceptedAt },
                  { label: "Package picked up", time: delivery.pickedUpAt },
                  { label: "Delivered",         time: delivery.deliveredAt },
                ].filter(t => t.time).map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 flex-1">{t.label}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(t.time).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-blue-200 text-xs pb-4">
              Auto-refreshes every 30 seconds
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}