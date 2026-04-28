"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "./landing/page";

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token) {
      setHasToken(true);
      if (role === "BUSINESS") router.push("/business/dashboard");
      else if (role === "DRIVER") router.push("/drivers/dashboard");
      else if (role === "CUSTOMER") router.push("/customers/dashboard");
      else if (role === "ADMIN") router.push("/dashboard");
    }
    setChecked(true);
  }, []);

  if (!checked) return null;
  if (hasToken) return null;
  return <LandingPage />;
}