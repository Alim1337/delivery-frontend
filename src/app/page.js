"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/landing");
      return;
    }

    // Verify token is still valid before redirecting
    api.get("/api/users/me")
      .then(() => {
        // Token valid — redirect by role
        if (role === "BUSINESS") router.push("/business/dashboard");
        else if (role === "DRIVER") router.push("/drivers/dashboard");
        else if (role === "CUSTOMER") router.push("/customers/dashboard");
        else if (role === "ADMIN") router.push("/dashboard");
        else router.push("/landing");
      })
      .catch(() => {
        // Token invalid/expired — clear and go to login
        localStorage.clear();
        router.push("/login");
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}