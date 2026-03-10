"use client";

import { useState } from "react";
import Co2Summary from "@/components/Co2Summary";
import EfficiencyPanel from "@/components/EfficiencyPanel";
import RealtimeCard from "@/components/cards/RealtimeCard";
import HourlyCo2Chart from "@/components/HourlyCo2Chart";
import HourlyPhChart from "@/components/HourlyPhChart";
import TrendPanel from "@/components/TrendPanel";
import UpdateAt from "@/components/UpdateAt";
import HistoryModal from "@/components/history/HistoryModal";

export default function CO2Page() {
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <section className="space-y-6 w-full pb-8">
      {/* Top bar */}
      <div className="flex flex-row justify-between items-center w-full">
        <div className="text-[#F1642E] font-medium flex items-center text-xs sm:text-sm md:text-base">
          <UpdateAt />
        </div>

        <button
          onClick={() => setOpenHistory(true)}
          className="bg-gradient-to-r from-[#76ABFC] to-[#0745CA] hover:opacity-90 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full flex items-center gap-1 sm:gap-2 transition-opacity shadow-md text-xs sm:text-sm font-medium shrink-0"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View history
        </button>
      </div>

      {/* Main Grid Layout: ใช้ items-stretch เพื่อให้พื้นที่ฝั่งซ้ายขยายเท่า EfficiencyPanel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        
        {/* ฝั่งซ้าย: เปลี่ยนเป็น flex-col และ h-full เพื่อจัดตำแหน่งภายใน */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="w-full md:w-4/5 mx-auto flex flex-col h-full">
            
            {/* ส่วนบน: CO₂ Reduced */}
            <div className="min-h-[200px]">
              <Co2Summary className="h-full" /> 
            </div>

            {/* ส่วนกลาง (Spacer): ใช้ flex-1 เพื่อดันกลุ่ม Sensor ลงไป 
                การใส่ justify-center ที่นี่จะช่วยให้ Sensor อยู่กึ่งกลางช่องว่างพอดี */}
            <div className="flex-1 flex flex-col justify-center py-8">
                {/* ส่วนล่าง: กลุ่ม Sensor 1-2-3 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <RealtimeCard title="CO₂ Sensor 1" column="co2_position1_ppm" />
                  <RealtimeCard title="CO₂ Sensor 2" column="co2_position2_ppm" />
                  <RealtimeCard title="CO₂ Sensor 3" column="co2_position3_ppm" />
                </div>
            </div>

          </div>
        </div>

        {/* ฝั่งขวา: Efficiency Panel (ตัวกำหนดความสูงฝั่งซ้าย) */}
        <div className="lg:col-start-3 flex justify-center lg:block">
          <EfficiencyPanel className="w-full max-w-[320px] h-full" />
        </div>
      </div>

      {/* กราฟด้านล่าง */}
      <div className="space-y-6">
        <HourlyCo2Chart />
        
      </div>

      <HistoryModal open={openHistory} onClose={() => setOpenHistory(false)} />
    </section>
  );
}




