"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) { router.push("/login"); return; }
    if (role === "BUSINESS") router.push("/business/dashboard");
    else if (role === "DRIVER") router.push("/driver/dashboard");
    else if (role === "CUSTOMER") router.push("/customer/dashboard");
    else if (role === "ADMIN") router.push("/dashboard");
    else router.push("/login");
  }, []);
  return null;
}