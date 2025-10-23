"use client";
import { useState } from "react";
import Navbar from "@/components/nav/Navbar";
import SideDrawer from "@/components/nav/SideDrawer";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f2a66] via-[#0b2a60] to-[#0a1f44] text-white">
      <Navbar onMenu={() => setOpen(true)} />
      <SideDrawer open={open} onClose={() => setOpen(false)} />
      {/* content container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

