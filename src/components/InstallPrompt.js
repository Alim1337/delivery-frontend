"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Show after 3 seconds
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
    }
    setShow(false);
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in slide-in-from-bottom">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm">Install DeliverFlow</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Add to your home screen for quick access
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleInstall}
              className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-blue-700 transition">
              Install
            </button>
            <button onClick={() => setShow(false)}
              className="flex-1 bg-gray-100 text-gray-600 text-xs font-medium py-2 rounded-lg hover:bg-gray-200 transition">
              Not now
            </button>
          </div>
        </div>
        <button onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}