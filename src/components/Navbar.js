"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Truck, LogOut, Menu, X } from "lucide-react";

export default function Navbar({ links = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
    setFirstName(localStorage.getItem("firstName") || "");
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push("/landing");
  };

  const roleColors = {
    CUSTOMER: "bg-blue-100 text-blue-700",
    DRIVER:   "bg-green-100 text-green-700",
    BUSINESS: "bg-purple-100 text-purple-700",
    ADMIN:    "bg-red-100 text-red-700",
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: logo + links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 hidden sm:block">DeliverFlow</span>
          </Link>
          {/* Desktop links */}
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

        {/* Right: role badge + name + logout */}
        <div className="flex items-center gap-2">
          {role && (
            <span className={`hidden sm:block px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[role] || "bg-gray-100 text-gray-600"}`}>
              {role}
            </span>
          )}
          {firstName && (
            <span className="text-sm text-gray-600 font-medium hidden sm:block">{firstName}</span>
          )}
          <button onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition px-2 md:px-3 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
          {/* Mobile menu button */}
          {links.length > 0 && (
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && links.length > 0 && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}>
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 mt-2">
            {role && (
              <p className="text-xs text-gray-400 px-3 mb-1">
                Signed in as <span className="font-semibold">{firstName}</span> ({role})
              </p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}