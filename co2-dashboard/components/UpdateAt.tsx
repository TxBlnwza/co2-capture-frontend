// components/UpdateAt.tsx
"use client";

import { useEffect, useState } from "react";
import { getLastUpdate, onLastUpdate } from "@/lib/updateBus";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function UpdateAt() {
  // ใช้ function initializer แทน setState ใน useEffect
  const [iso, setIso] = useState<string | null>(() => getLastUpdate());

  useEffect(() => {
    // เอา setIso(getLastUpdate()) ออก - ใช้แค่ subscription
    const off = onLastUpdate((v) => setIso(v));

    return () => {
      if (typeof off === "function") off();
    };
  }, []);

  let text = "—";
  if (iso) {
    const d = new Date(iso);
    text = `${pad(d.getHours())} : ${pad(d.getMinutes())} : ${pad(d.getSeconds())}`;
  }

  return <span>Update at : {text}</span>;
}

