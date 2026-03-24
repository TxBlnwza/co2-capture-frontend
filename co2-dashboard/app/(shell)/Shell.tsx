"use client";

import { useState } from "react";
import Navbar from "@/components/nav/Navbar";
import SideDrawer from "@/components/nav/SideDrawer";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen text-gray-900">
      <Navbar onMenu={() => setOpen(true)} />
      <SideDrawer open={open} onClose={() => setOpen(false)} />

      {/* 1. เปลี่ยน max-w-7xl เป็น max-w-[1440px] (หรือ max-w-full ถ้าอยากให้เต็มจอจริงๆ)
          2. ปรับ px (Padding) ให้เล็กลงเพื่อให้เนื้อหาชิดขอบซ้าย-ขวามากขึ้น
      */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all">
        {children}
      </main>
    </div>
  );
}

