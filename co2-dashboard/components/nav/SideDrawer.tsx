"use client";
import Link from "next/link";

export default function SideDrawer({ open, onClose }: { open: boolean; onClose: () => void; }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside className={`fixed left-0 top-0 h-full w-72 bg-white shadow-xl transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <span className="font-semibold">Menu</span>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="2"/></svg>
          </button>
        </div>
        <nav className="p-2 space-y-1">
          <Link href="/" className="block px-3 py-2 rounded hover:bg-gray-100">CO₂ Dashboard</Link>
          <Link href="/energy" className="block px-3 py-2 rounded hover:bg-gray-100">Energy Dashboard</Link>
        </nav>
      </aside>
    </>
  );
}
