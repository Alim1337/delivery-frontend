"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Truck } from "lucide-react";

const vehicles = [
  { id: "BIKE", label: "Bicycle", emoji: "🚲" },
  { id: "SCOOTER", label: "Scooter", emoji: "🛵" },
  { id: "CAR", label: "Car", emoji: "🚗" },
  { id: "TRUCK", label: "Truck", emoji: "🚚" },
];

export default function DriverSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ vehicleType: "", vehiclePlate: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleType) { toast.error("Please select a vehicle type"); return; }
    setLoading(true);
    try {
      await api.post("/api/profile/driver", form);
      toast.success("Profile setup complete!");
      router.push("/drivers/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.error || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Setup your driver profile</h1>
          <p className="text-gray-500 text-sm mt-1">Tell us about your vehicle</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Vehicle type</label>
            <div className="grid grid-cols-2 gap-3">
              {vehicles.map((v) => (
                <button key={v.id} type="button"
                  onClick={() => setForm({ ...form, vehicleType: v.id })}
                  className={`p-4 rounded-xl border-2 text-center transition ${
                    form.vehicleType === v.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-100 hover:border-green-300"
                  }`}>
                  <div className="text-2xl mb-1">{v.emoji}</div>
                  <div className="text-sm font-medium text-gray-700">{v.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle plate</label>
            <input
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase"
              placeholder="e.g. 123-45-678"
              value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50">
            {loading ? "Saving..." : "Start delivering →"}
          </button>
        </form>
      </div>
    </div>
  );
}