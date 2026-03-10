"use client";

import { useState } from "react";
import Navbar from "@/components/nav/Navbar";
import SideDrawer from "@/components/nav/SideDrawer";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    // เอา bg-gradient สีเข้มออก และแก้ text-white เป็น text-gray-900
    <div className="min-h-screen text-gray-900">
      <Navbar onMenu={() => setOpen(true)} />
      <SideDrawer open={open} onClose={() => setOpen(false)} />

      {/* content container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

