"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Truck, LogOut } from "lucide-react";

export default function Navbar({ links = [] }) {
  const router = useRouter();
  const pathname = usePathname();

  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setFirstName(localStorage.getItem("firstName") || "");
    setRole(localStorage.getItem("role") || "");
  }, []);

  const roleColors = {
    CUSTOMER: "bg-blue-100 text-blue-700",
    DRIVER: "bg-green-100 text-green-700",
    BUSINESS: "bg-purple-100 text-purple-700",
    ADMIN: "bg-red-100 text-red-700",
  };

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800">DeliverFlow</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === link.href
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {role && (
            <span className={`hidden sm:block px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[role] || "bg-gray-100 text-gray-600"}`}>
              {role}
            </span>
          )}
          {firstName && (
            <span className="text-sm text-gray-600 font-medium hidden sm:block">
              {firstName}
            </span>
          )}
          <button onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition px-3 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}