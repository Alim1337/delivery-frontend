"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.replace("/landing");
      return;
    }

    if (role === "BUSINESS") router.replace("/business/dashboard");
    else if (role === "DRIVER") router.replace("/drivers/dashboard");
    else if (role === "CUSTOMER") router.replace("/customers/dashboard");
    else if (role === "ADMIN") router.replace("/dashboard");
    else router.replace("/landing");
  }, []);

  return null;
}