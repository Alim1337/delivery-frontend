"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      <div className="flex gap-6 text-sm font-medium">
        <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
        <Link href="/customers" className="hover:text-blue-400">Customers</Link>
        <Link href="/drivers" className="hover:text-blue-400">Drivers</Link>
        <Link href="/orders" className="hover:text-blue-400">Orders</Link>
      </div>
      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded text-sm">
        Logout
      </button>
    </nav>
  );
}