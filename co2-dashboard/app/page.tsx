// app/page.tsx
"use client";

import { useState } from "react";
import Co2Summary from "@/components/Co2Summary";
import EfficiencyPanel from "@/components/EfficiencyPanel";
import RealtimeCard from "@/components/cards/RealtimeCard";
import HourlyCo2Chart from "@/components/HourlyCo2Chart";
import HourlyPhChart from "@/components/HourlyPhChart";
import TrendPanel from "@/components/TrendPanel";
import UpdateAt from "@/components/UpdateAt";                // 👈 ใช้ตัวนี้ตามเดิม
import HistoryModal from "@/components/history/HistoryModal";

export default function CO2Page() {
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <section className="space-y-6">
      {/* Top bar */}
      <div className="w-full md:w-4/5 mx-auto flex items-center justify-between">
        <div className="text-sm text-white/80">
          <UpdateAt />{/* 👈 เวลาอัปเดตล่าสุด */}
        </div>

        <button
          onClick={() => setOpenHistory(true)}
          className="rounded-full bg-white/15 px-4 py-2 text-sm text-white border border-white/20 hover:bg-white/25"
        >
          View history
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4">
        {/* ซ้ายบน: CO₂ Reduced */}
        <div className="lg:col-span-2">
          <Co2Summary />
        </div>

        {/* ขวา: Average Efficiency (กึ่งกลางบนจอเล็ก, เต็มคอลัมน์บนจอใหญ่) */}
        <div className="lg:col-start-3 lg:row-span-2 h-full flex lg:block justify-center [&>*]:h-full">
          <EfficiencyPanel className="h-full" />
        </div>

        {/* ซ้ายล่าง: การ์ด 3 ใบ เลื่อนลงเล็กน้อยแบบ responsive */}
        <div className="lg:col-span-2 lg:row-start-2 mt-6 md:mt-8 lg:mt-14">
          <div className="w-full md:w-4/5 mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            <RealtimeCard title="Sensor 1" column="co2_position1_ppm" />
            <RealtimeCard title="Sensor 2" column="co2_position2_ppm" />
            <RealtimeCard title="Sensor 3" column="co2_position3_ppm" />
          </div>
        </div>
      </div>

      <HourlyCo2Chart />
      <HourlyPhChart />
      <TrendPanel />

      {/* Popup */}
      <HistoryModal open={openHistory} onClose={() => setOpenHistory(false)} />
    </section>
  );
}






