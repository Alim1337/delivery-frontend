"use client";
import { useState, useEffect } from "react";
import { LANGUAGES } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const [lang, setLang] = useState("en");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "en";
    setLang(saved);
    document.documentElement.lang = saved;
    document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
  }, []);

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    setOpen(false);
    window.location.reload(); // reload to apply translations
  };

  const current = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm transition">
        <span>{current?.flag}</span>
        <span className="hidden sm:block text-gray-600">{current?.code.toUpperCase()}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 min-w-36">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50 transition text-left ${
                lang === l.code ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}>
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}