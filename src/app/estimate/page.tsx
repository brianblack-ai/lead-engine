"use client";
import { useEffect, useState } from "react";

export default function EstimatePage() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    setAllowed(document.cookie.includes("verifiedLead=1"));
  }, []);
  if (!allowed) return <p>Please verify your email to view your estimate.</p>;

  return <div>/* TODO: render your estimate UI here */ Verified ✅</div>;
}