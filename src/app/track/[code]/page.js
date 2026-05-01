"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/axios";
import {
  Truck, MapPin, Package, CheckCircle,
  Clock, XCircle, Search, Building2, User, Phone
} from "lucide-react";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), { ssr: false });

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
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    if (params?.code && params.code !== "DLV-00000000") {
      fetchDelivery(params.code);
      const interval = setInterval(() => fetchDelivery(params.code), 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [params?.code]);

  useEffect(() => {
    if (!delivery?.trackingCode) return;
    if (!["ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(delivery?.status)) return;

    const fetchLocation = async () => {
      try {
        const res = await api.get(`/api/deliveries/track/${delivery.trackingCode}/location`);
        if (res.data.available) {
          setDriverLocation({
            lat: res.data.latitude,
            lng: res.data.longitude,
            name: res.data.driverName,
          });
        }
      } catch {}
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 15000);
    return () => clearInterval(interval);
  }, [delivery?.trackingCode, delivery?.status]);

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
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Track Your Delivery</h1>
          <p className="text-blue-200 text-sm">Enter your tracking code to see live status</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/95"
              placeholder="e.g. DLV-A8X3B2C1"
              value={search}
              onChange={(e) => setSearch(e.target.value.toUpperCase())}
            />
          </div>
          <button type="submit"
            className="bg-white text-blue-600 font-semibold px-5 py-3 rounded-xl hover:bg-blue-50 transition whitespace-nowrap">
            Track
          </button>
        </form>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-xl">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading delivery info...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-xl">
            <XCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">{error}</p>
            <p className="text-gray-400 text-sm mt-1">Double-check the code and try again</p>
          </div>
        ) : delivery ? (
          <div className="space-y-4">
            {/* Main status card */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xl">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-xs text-gray-400 font-mono mb-0.5">Tracking code</p>
                  <p className="text-base font-bold text-gray-800 font-mono tracking-wider">
                    {delivery.trackingCode}
                  </p>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  delivery.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                  delivery.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                  delivery.status === "ON_THE_WAY" ? "bg-purple-100 text-purple-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {delivery.status?.replace(/_/g, " ")}
                </span>
              </div>

              {/* Progress */}
              {delivery.status !== "CANCELLED" ? (
                <div className="relative mb-5">
                  <div className="flex justify-between relative z-10">
                    {statusSteps.map((step, i) => {
                      const Icon = step.icon;
                      const done = i <= currentStep;
                      const active = i === currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                            done
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-200 text-gray-300"
                          } ${active ? "ring-4 ring-blue-100 scale-110" : ""}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-xs text-center leading-tight hidden sm:block ${
                            done ? "text-blue-600 font-medium" : "text-gray-400"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute top-[18px] left-5 right-5 h-0.5 bg-gray-100 -z-0">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: currentStep >= 0
                          ? `${(currentStep / (statusSteps.length - 1)) * 100}%`
                          : "0%"
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl mb-5">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-600 font-medium text-sm">This delivery was cancelled</p>
                </div>
              )}

              {/* Addresses */}
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

            {/* Map — show when driver is active */}
            {["ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(delivery.status) && (
              <div className="bg-white rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                    Live Tracking
                  </p>
                  {delivery.status === "ON_THE_WAY" && (
                    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Driver is on the way
                    </span>
                  )}
                </div>
                <DeliveryMap
                  pickupAddress={delivery.pickupAddress}
                  dropoffAddress={delivery.dropoffAddress}
                  driverLat={driverLocation?.lat}
                  driverLng={driverLocation?.lng}
                  driverName={driverLocation?.name}
                  status={delivery.status}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Updates every 15 seconds
                </p>
              </div>
            )}

            {/* People involved card */}
            <div className="bg-white rounded-2xl p-5 shadow-xl">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-4">
                People Involved
              </p>
              <div className="space-y-4">

                {/* Business / Sender */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Sent by</p>
                    <p className="font-semibold text-gray-800 text-sm">{delivery.businessName}</p>
                  </div>
                  <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-lg font-medium flex-shrink-0">
                    Business
                  </span>
                </div>

                <div className="border-t border-gray-50" />

                {/* Customer / Receiver */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Recipient</p>
                    <p className="font-semibold text-gray-800 text-sm">{delivery.customerName}</p>
                    {delivery.customerPhone && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{delivery.customerPhone}</p>
                      </div>
                    )}
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium flex-shrink-0">
                    Customer
                  </span>
                </div>

                {/* Driver — only show if assigned */}
                {delivery.driverName && (
                  <>
                    <div className="border-t border-gray-50" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">Your driver</p>
                        <p className="font-semibold text-gray-800 text-sm">{delivery.driverName}</p>
                        {delivery.driverPhone && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">{delivery.driverPhone}</p>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${
                        delivery.status === "ON_THE_WAY"
                          ? "bg-purple-50 text-purple-600 animate-pulse"
                          : "bg-green-50 text-green-600"
                      }`}>
                        {delivery.status === "ON_THE_WAY" ? "🚗 On the way" : "Driver"}
                      </span>
                    </div>
                  </>
                )}

                {/* Waiting for driver */}
                {!delivery.driverName && delivery.status === "PENDING" && (
                  <>
                    <div className="border-t border-gray-50" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Driver</p>
                        <p className="text-sm text-gray-400 italic">Waiting for a driver to accept...</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl p-5 shadow-xl">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-4">
                Timeline
              </p>
              <div className="space-y-3">
                {[
                  { label: "Order placed",      time: delivery.createdAt,   icon: "📦" },
                  { label: "Driver accepted",   time: delivery.acceptedAt,  icon: "🚗" },
                  { label: "Package picked up", time: delivery.pickedUpAt,  icon: "📤" },
                  { label: "Delivered",         time: delivery.deliveredAt, icon: "✅" },
                ].filter(t => t.time).map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-base flex-shrink-0">{t.icon}</span>
                    <span className="text-sm text-gray-600 flex-1">{t.label}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(t.time).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-blue-200 text-xs pb-4">
              🔄 Auto-refreshes every 30 seconds
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-xl">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Enter a tracking code above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}