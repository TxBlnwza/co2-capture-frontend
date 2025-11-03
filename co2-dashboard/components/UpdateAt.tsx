// components/UpdateAt.tsx
"use client";

import { useEffect, useState } from "react";
import { getLastUpdate, onLastUpdate } from "@/lib/updateBus";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function UpdateAt() {
  const [iso, setIso] = useState<string | null>(null);

  useEffect(() => {
    // เซ็ตค่าเริ่มต้นจากบัสทันทีตอน mount
    setIso(getLastUpdate());

    // สมัครฟังการอัปเดตเวลา
    const off = onLastUpdate((v) => setIso(v));

    // cleanup อย่างปลอดภัย เผื่อ onLastUpdate ไม่ได้คืนฟังก์ชัน
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

