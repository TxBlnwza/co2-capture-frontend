'use client';

import { useEffect, useState } from 'react';
import { Co2Row, getLatestCo2, subscribeCo2Changes } from '@/lib/co2';
import SystemMap from '@/components/SystemMap';

// ===========================================================================
// Main Page Component
// ===========================================================================

export default function SystemOverviewPage() {
  // -------------------------------------------------------------------------
  // 1. State
  // -------------------------------------------------------------------------
  const [latestData, setLatestData] = useState<Co2Row | null>(null);

  // -------------------------------------------------------------------------
  // 2. Effects
  // -------------------------------------------------------------------------
  useEffect(() => {
    // ดึงข้อมูลล่าสุดตอนโหลดหน้าแรก
    getLatestCo2().then((data) => {
      if (data) setLatestData(data); 
    });

    // สมัครรับข้อมูล Real-time เมื่อมีการเปลี่ยนแปลง
    const unsubscribe = subscribeCo2Changes((newRow) => {
      setLatestData(newRow);
    });

    // คืนค่า (Cleanup) เมื่อ Component ถูกทำลาย
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------------------
  // 3. Render UI
  // -------------------------------------------------------------------------
  return (
    <main 
      className="min-h-screen overflow-x-hidden pt-6 pb-20"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      
      {/* --- Header Section --- */}
      <header className="mb-8">
        <h1 
          className="text-3xl md:text-4xl font-bold tracking-tight uppercase leading-none"
          style={{ 
            color: '#012553',
            marginLeft: '-1px' // Optical alignment ให้ดูชิดขอบจริงๆ
          }}
        >
          System Overview
        </h1>
      </header>

      {/* --- Map Display Section --- */}
      <div className="w-full flex justify-center items-start">
        {/* กว้างเต็มพื้นที่ที่ Shell อนุญาต */}
        <div className="w-full transition-all duration-500"> 
          <SystemMap 
            data={latestData} 
            phData={{ ph_1: 7.8, ph_2: 9.6 }} 
          />
        </div>
      </div>

    </main>
  );
}