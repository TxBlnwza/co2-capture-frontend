// app/(shell)/Shell.tsx
"use client";

import { useState } from "react";
import Navbar from "@/components/nav/Navbar";
import SideDrawer from "@/components/nav/SideDrawer";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3B5A9B] via-[#0c2a60] via-40% to-[#081b3c] text-white">
      <Navbar onMenu={() => setOpen(true)} />
      <SideDrawer open={open} onClose={() => setOpen(false)} />

      {/* content container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}


