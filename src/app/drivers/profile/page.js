"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { Truck, Star, Save, User, TrendingUp, Package } from "lucide-react";

const links = [
  { href: "/drivers/dashboard", label: "Available Jobs" },
  { href: "/drivers/my-deliveries", label: "My History" },
  { href: "/drivers/profile", label: "Profile" },
];

const vehicles = [
  { id: "BIKE",    label: "Bicycle", emoji: "🚲" },
  { id: "SCOOTER", label: "Scooter", emoji: "🛵" },
  { id: "CAR",     label: "Car",     emoji: "🚗" },
  { id: "TRUCK",   label: "Truck",   emoji: "🚚" },
];

export default function DriverProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userForm, setUserForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [vehicleForm, setVehicleForm] = useState({ vehicleType: "", vehiclePlate: "" });
  const [savingUser, setSavingUser] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "DRIVER") { router.push("/login"); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [userRes, profileRes] = await Promise.all([
        api.get("/api/users/me"),
        api.get("/api/profile/driver").catch(() => ({ data: null })),
      ]);
      setUser(userRes.data);
      setUserForm({
        firstName: userRes.data.firstName || "",
        lastName: userRes.data.lastName || "",
        phone: userRes.data.phone || "",
      });
      if (profileRes.data) {
        setProfile(profileRes.data);
        setVehicleForm({
          vehicleType: profileRes.data.vehicleType || "",
          vehiclePlate: profileRes.data.vehiclePlate || "",
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
    } catch {
      toast.error("Failed to update");
    } finally {
      setSavingUser(false);
    }
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleForm.vehicleType) { toast.error("Select a vehicle type"); return; }
    setSavingVehicle(true);
    try {
      await api.post("/api/profile/driver", vehicleForm);
      toast.success("Vehicle updated!");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update vehicle");
    } finally {
      setSavingVehicle(false);
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Driver Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your driver information</p>
        </div>

        {/* Stats card */}
        {profile && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  <span className="text-xl font-bold">
                    {profile.rating?.toFixed(1) || "—"}
                  </span>
                </div>
                <p className="text-green-100 text-xs">Rating</p>
              </div>
              <div>
                <p className="text-xl font-bold mb-1">{profile.totalDeliveries}</p>
                <p className="text-green-100 text-xs">Deliveries</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className={`w-2 h-2 rounded-full ${profile.available ? "bg-green-300 animate-pulse" : "bg-red-300"}`} />
                  <span className="text-sm font-semibold">
                    {profile.available ? "Active" : "Busy"}
                  </span>
                </div>
                <p className="text-green-100 text-xs">Status</p>
              </div>
            </div>
          </div>
        )}

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
            </div>
            <button type="submit" disabled={savingUser}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
              <Save className="w-4 h-4" />
              {savingUser ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Vehicle info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <Truck className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Vehicle Information</h2>
              <p className="text-xs text-gray-400">Update your vehicle details</p>
            </div>
          </div>
          <form onSubmit={handleSaveVehicle} className="p-4 md:p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Vehicle type</label>
              <div className="grid grid-cols-4 gap-2">
                {vehicles.map((v) => (
                  <button key={v.id} type="button"
                    onClick={() => setVehicleForm({ ...vehicleForm, vehicleType: v.id })}
                    className={`p-3 rounded-xl border-2 text-center transition ${
                      vehicleForm.vehicleType === v.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-100 hover:border-green-300"
                    }`}>
                    <div className="text-xl mb-0.5">{v.emoji}</div>
                    <div className="text-xs font-medium text-gray-600">{v.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle plate</label>
              <input
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase tracking-wider bg-gray-50/50"
                placeholder="e.g. 123-45-678"
                value={vehicleForm.vehiclePlate}
                onChange={(e) => setVehicleForm({ ...vehicleForm, vehiclePlate: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <button type="submit" disabled={savingVehicle}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
              <Save className="w-4 h-4" />
              {savingVehicle ? "Saving..." : "Update Vehicle"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}