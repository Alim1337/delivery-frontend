"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Truck, LogOut, Menu, X } from "lucide-react";
import NotificationBell from "./NotificationBell";
import DarkModeToggle from "./DarkModeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar({ links = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [firstName, setFirstName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
    setFirstName(localStorage.getItem("firstName") || "");
    setToken(localStorage.getItem("token"));
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push("/landing");
  };

  const roleColors = {
    CUSTOMER: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    DRIVER:   "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    BUSINESS: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    ADMIN:    "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-800 dark:text-white hidden sm:block">DeliverFlow</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  pathname === link.href
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {role && (
            <span className={`hidden sm:block px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[role] || "bg-gray-100 text-gray-600"}`}>
              {role}
            </span>
          )}
          {firstName && (
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium hidden md:block">{firstName}</span>
          )}
          <DarkModeToggle />
          <LanguageSwitcher />
          {token && <NotificationBell />}
          <button onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 transition px-2 md:px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block text-sm">Logout</span>
          </button>
          {links.length > 0 && (
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {menuOpen && links.length > 0 && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}>
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-1">
            {firstName && role && (
              <p className="text-xs text-gray-400 px-3">
                {firstName} · <span className="font-medium">{role}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}