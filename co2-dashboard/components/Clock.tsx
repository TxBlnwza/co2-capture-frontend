"use client";
import { useEffect, useState } from "react";

export default function Clock() {
  // ใช้ function initializer แทนการ set ใน useEffect
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    // เอา setNow(new Date()) ออก - ใช้แค่ interval
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return <>Update at : {hh} : {mm} : {ss}</>;
}
