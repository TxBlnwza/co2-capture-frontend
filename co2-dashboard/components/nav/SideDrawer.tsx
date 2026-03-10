"use client";
import Link from "next/link";

export default function SideDrawer({ open, onClose }: { open: boolean; onClose: () => void; }) {
  return (
    <>
      {/* ส่วนฉากหลังสีดำโปร่งแสง */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      
      {/* ตัว SideDrawer */}
      <aside 
        className={`fixed left-0 top-0 z-50 h-full w-72 shadow-xl transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } bg-gradient-to-b from-[#78A1C9] to-[#C3E9FF] text-white`}
      >
        {/* แก้ไขตรงนี้: ปรับเป็น h-[72px] เพื่อดันเส้นขอบด้านล่างให้ต่ำลงมาอีก */}
        <div className="h-[72px] flex items-center px-4 border-b border-white/30">
          <button className="p-2 rounded-full hover:bg-white/20 transition-colors" onClick={onClose} aria-label="Close Menu">
            {/* แก้ไขตรงนี้: ปรับขนาด Hamburger ให้ใหญ่ขึ้นเป็น 40x40 */}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {/* ส่วนเมนู */}
        <nav className="p-4 pt-6 space-y-4">
          <Link 
            href="/" 
            className="block px-4 py-3 rounded-xl bg-[#96BAE3] border-[0.5px] border-white hover:brightness-105 transition-all text-left font-medium shadow-sm"
            onClick={onClose}
          >
            CO₂ Dashboard
          </Link>
          <Link 
            href="/energy" 
            className="block px-4 py-3 rounded-xl bg-[#96BAE3] border-[0.5px] border-white hover:brightness-105 transition-all text-left font-medium shadow-sm"
            onClick={onClose}
          >
            Energy Dashboard
          </Link>
        </nav>
      </aside>
    </>
  );
}