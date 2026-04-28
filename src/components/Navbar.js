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
    CUSTOMER: "bg-blue-50 text-blue-600 border-blue-100",
    DRIVER:   "bg-emerald-50 text-emerald-600 border-emerald-100",
    BUSINESS: "bg-purple-50 text-purple-600 border-purple-100",
    ADMIN:    "bg-red-50 text-red-600 border-red-100",
  };

  const roleInitial = firstName ? firstName.charAt(0).toUpperCase() : role?.charAt(0);
  const avatarColors = {
    CUSTOMER: "bg-blue-100 text-blue-600",
    DRIVER:   "bg-emerald-100 text-emerald-600",
    BUSINESS: "bg-purple-100 text-purple-600",
    ADMIN:    "bg-red-100 text-red-600",
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-15 flex items-center justify-between gap-3" style={{ height: "60px" }}>

        {/* ── Left: logo + desktop links ── */}
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 hidden sm:block tracking-tight">DeliverFlow</span>
          </Link>

          {/* Desktop nav links */}
          {links.length > 0 && (
            <div className="hidden md:flex items-center gap-0.5">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    pathname === link.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: user info + logout + mobile toggle ── */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Role badge — desktop only */}
          {role && (
            <span className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[role] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
              {role}
            </span>
          )}

          {/* Avatar + name — desktop only */}
          {firstName && (
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColors[role] || "bg-gray-100 text-gray-600"}`}>
                {roleInitial}
              </div>
              <span className="text-sm text-gray-700 font-medium">{firstName}</span>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-all duration-150 px-2.5 py-2 rounded-lg hover:bg-red-50 active:bg-red-100"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:block">Logout</span>
          </button>

          {/* Mobile hamburger — only when there are links */}
          {links.length > 0 && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-all duration-150"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${
          menuOpen && links.length > 0 ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-100 bg-white px-4 pt-3 pb-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                pathname === link.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* User info row in mobile menu */}
          {(firstName || role) && (
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
              <div className="flex items-center gap-2.5">
                {firstName && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColors[role] || "bg-gray-100 text-gray-600"}`}>
                    {roleInitial}
                  </div>
                )}
                <div>
                  {firstName && <p className="text-sm font-semibold text-gray-800">{firstName}</p>}
                  {role && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${roleColors[role] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
                      {role}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-all duration-150 px-3 py-2 rounded-lg hover:bg-red-50 active:bg-red-100"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}