"use client";
import { useState } from "react";
import Link from "next/link";

export default function SideDrawer({ open, onClose }: { open: boolean; onClose: () => void; }) {
  // สร้าง state สำหรับเก็บ device ที่เลือก
  const [selectedDevice, setSelectedDevice] = useState("Device 1");
  // state สำหรับเปิด/ปิดตัวเลือก dropdown
  const [isDeviceOpen, setIsDeviceOpen] = useState(false);

  const devices = ["Device 1"];

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
        <div className="h-[72px] flex items-center px-4 border-b border-white/30">
          <button className="p-2 rounded-full hover:bg-white/20 transition-colors" onClick={onClose} aria-label="Close Menu">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        {/* ส่วนเมนู */}
        <nav className="p-4 pt-6 space-y-6"> {/* เพิ่ม space-y เพื่อระยะห่างที่ดีขึ้น */}
          
          {/* --- เพิ่มส่วน Select Device (Re-designed) --- */}
          <div className="space-y-3 px-2"> {/* เพิ่ม padding เล็กน้อยเพื่อให้ดูไม่อึดอัด */}
            <div className="flex items-center justify-between">
              {/* ข้อความ SELECT DEVICE ใหญ่ขึ้นเล็กน้อย */}
              <label className="text-sm font-semibold uppercase opacity-90 tracking-wider">SELECT DEVICE</label>
              
              {/* ปุ่ม Dropdown ที่เล็กลงและอยู่ทางขวา */}
              <div className="relative">
                <button 
                  onClick={() => setIsDeviceOpen(!isDeviceOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/30 hover:bg-white/20 transition-all text-sm font-medium"
                >
                  <span className="opacity-80">{selectedDevice}</span>
                  <svg 
                    className={`transition-transform duration-200 ${isDeviceOpen ? "rotate-180" : ""}`} 
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>

                {/* รายการ Device Dropdown */}
                {isDeviceOpen && (
                  <div className="absolute right-0 w-40 mt-1.5 bg-[#8FB5DD] border border-white/30 rounded-xl overflow-hidden shadow-lg z-10 text-sm">
                    {devices.map((device) => (
                      <button 
                        key={device}
                        onClick={() => {
                          setSelectedDevice(device);
                          setIsDeviceOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-white/20 transition-colors border-b border-white/10 ${device === selectedDevice ? 'bg-white/10 font-medium' : ''}`}
                      >
                        {device}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-white/20 mx-2" /> {/* เส้นคั่นเล็กน้อย */}

          {/* ปุ่มเมนูหลัก (ยังคงเดิมเพื่อเปรียบเทียบขนาด) */}
          <div className="space-y-4">
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
            <Link
              href="/system-overview" 
              className="block px-4 py-3 rounded-xl bg-[#96BAE3] border-[0.5px] border-white hover:brightness-105 transition-all text-left font-medium shadow-sm"
              onClick={onClose}
            >
              System Overview
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}