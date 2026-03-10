"use client";

import React from "react";
// นำเข้าเฉพาะ Chart ด้านล่างที่ต้องการเก็บไว้
import HourlyPhChart from "@/components/HourlyPhChart";

// ---------------------------------------------------------------------------
// สร้าง Component ใหม่: สำหรับเกจวัดแบบวงกลม (Circular Gauge)
// ---------------------------------------------------------------------------
const CircularGauge = ({ 
  value, 
  unit, 
  label1, 
  label2, 
  color, 
  percentage 
}: { 
  value: string; 
  unit: string; 
  label1: string; 
  label2: string; 
  color: string; 
  percentage: number; 
}) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="text-base text-[#173396] font-bold mb-1">{label1}</div>
      <div className="text-sm text-blue-600 mb-4">{label2}</div>
      <div className="relative w-24 h-24">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        {/* Center Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-1">
          <span className="text-xl font-bold text-gray-700 leading-none">{value}</span>
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// หน้าเพจหลัก
// ---------------------------------------------------------------------------
export default function EnergyPage() {
  return (
    <section className="w-full font-sans space-y-8 pb-8">
      
      {/* ส่วน Header: บังคับให้อยู่บรรทัดเดียวกันเสมอด้วย flex-row และปรับขนาดในจอเล็กไม่ให้เบียดกัน */}
      <div className="flex flex-row justify-between items-center w-full">
        <div className="text-[#F1642E] font-medium flex items-center text-xs sm:text-sm md:text-base">
          Update at · 20 : 25 : 65
        </div>
        <button className="bg-gradient-to-r from-[#76ABFC] to-[#0745CA] hover:opacity-90 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full flex items-center gap-1 sm:gap-2 transition-opacity shadow-md text-xs sm:text-sm font-medium shrink-0">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View history
        </button>
      </div>

      {/* ส่วน Cards สรุปข้อมูล */}
      <div className="flex flex-wrap justify-center items-center gap-10 w-full mx-auto">
        
        {/* การ์ด 1: Energy Used from Solar */}
        <div className="w-[210px] h-[210px] bg-gradient-to-b from-[#72D0E8] to-[#2779BB] border border-white rounded-3xl p-6 text-white shadow-lg flex flex-col justify-center items-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
          
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-sm font-medium mb-2 opacity-90 text-center">Energy Used from Solar</h2>
          <div className="text-4xl font-bold tracking-tight flex items-baseline gap-1 mt-1">
            540 <span className="text-lg font-normal opacity-90">kWh</span>
          </div>
        </div>

        {/* การ์ด 2: pH Shells & Wolffia */}
        <div className="w-full max-w-[280px] h-[210px] bg-gradient-to-b from-[#B0D5FF] to-[#EEF2FF] border border-[#60B7FF] rounded-3xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center shrink-0">
          <div className="flex w-full justify-around items-center divide-x divide-blue-200">
            <CircularGauge 
              label1="pH" 
              label2="Shells" 
              value="9.6" 
              unit="pH" 
              color="#3B82F6"
              percentage={80} 
            />
            <CircularGauge 
              label1="pH" 
              label2="Wolffia" 
              value="7.8" 
              unit="pH" 
              color="#06B6D4"
              percentage={65} 
            />
          </div>
        </div>

        {/* การ์ด 3: Solar cell Temp */}
        <div className="w-full max-w-[280px] h-[210px] bg-gradient-to-b from-[#B0D5FF] to-[#EEF2FF] border border-[#60B7FF] rounded-3xl p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center shrink-0">
          <div className="flex w-full justify-around items-center divide-x divide-blue-200">
            <CircularGauge 
              label1="Solar cell" 
              label2="Front Temp" 
              value="49.3" 
              unit="°C" 
              color="#EF4444"
              percentage={75} 
            />
            <CircularGauge 
              label1="Solar cell" 
              label2="Rear Temp" 
              value="41.1" 
              unit="°C" 
              color="#F97316"
              percentage={60} 
            />
          </div>
        </div>

      </div>

      {/* กราฟด้านล่าง */}
      <div className="mt-8 w-full overflow-hidden">
         <HourlyPhChart />
      </div>

    </section>
  );
}