"use client";
import { useEffect, useState } from "react";
import { Languages } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "EN", dir: "ltr" },
  { code: "ar", label: "AR", dir: "rtl" },
  { code: "fr", label: "FR", dir: "ltr" },
];

export default function LanguageSwitcher() {
  const [lang, setLang] = useState("en");
  const [open, setOpen] = useState(false);

  // Read initial lang set by layout.js inline script
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang") || "en";
      setLang(stored);
    } catch (e) {}

    // Close dropdown on outside click
    const handler = (e) => {
      if (!e.target.closest("[data-lang-switcher]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLang = (code) => {
    const entry = LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
    setLang(code);
    setOpen(false);

    document.documentElement.lang = code;
    document.documentElement.dir = entry.dir;

    try {
      localStorage.setItem("lang", code);
    } catch (e) {}
  };

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="relative" data-lang-switcher="">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch language"
        className="flex items-center gap-1 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-xs font-semibold"
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:block">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-24 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => switchLang(l.code)}
              className={`w-full text-left px-3 py-2 text-sm font-medium transition ${
                lang === l.code
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
