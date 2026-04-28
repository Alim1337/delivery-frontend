"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      else if (role === "DRIVER") router.push("/driver/dashboard");
      else if (role === "CUSTOMER") router.push("/customer/dashboard");
      else if (role === "ADMIN") router.push("/dashboard");
    } else {
      // 👉 no token → redirect to landing page
      router.push("/landing");
    }

    setChecked(true);
  }, [router]);

  if (!checked) return null;
  return null;
}