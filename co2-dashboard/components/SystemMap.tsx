import React from 'react';
import { Co2Row } from '@/lib/co2';

// ===========================================================================
// Interfaces
// ===========================================================================

interface SystemMapProps {
  data: Co2Row | null;
  phData?: { ph_1: number; ph_2: number };
}

interface SensorNodeProps {
  top: number;
  left: number;
  label: string;
  realtimeValue?: number | null;
  unit: string;
  width?: number;
  height?: number;
  offsetTop?: number;
  accentColor?: string;
}

// ===========================================================================
// Sub-Component: SensorNode
// ===========================================================================

const SensorNode = ({
  top,
  left,
  label,
  realtimeValue,
  unit,
  width = 100,
  height = 80,
  offsetTop = 0, 
  accentColor = "text-blue-900"
}: SensorNodeProps) => {
  
  const isPh = unit === "pH";
  const glowClass = isPh 
    ? "group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] group-hover:bg-emerald-500/10" 
    : "group-hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] group-hover:bg-blue-500/10";

  // ตรวจจับขอบจอ (Edge Detection)
  const isLeftEdge = left < 35;  
  const isRightEdge = left > 65; 

  // ตำแหน่งกล่องข้อความ
  const tooltipPosStyle: React.CSSProperties = isLeftEdge 
    ? { left: '0' } 
    : isRightEdge 
    ? { right: '0' } 
    : { left: '50%', transform: 'translateX(-50%)' };

  // ตำแหน่งลูกศรสามเหลี่ยม
  const arrowStyle: React.CSSProperties = isLeftEdge
    ? { left: `${width / 2}px`, transform: 'translateX(-50%)' }
    : isRightEdge
    ? { right: `${width / 2}px`, transform: 'translateX(50%)' }
    : { left: '50%', transform: 'translateX(-50%)' };

  return (
    <div
      className="absolute z-10"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        transform: 'translate(-50%, -50%)',
        marginTop: `${offsetTop}px`, 
      }}
    >
      <div
        className="group relative cursor-pointer"
        style={{
          width: `${width}px`,   
          height: `${height}px`, 
        }}
      >
        {/* พื้นที่ดักเมาส์ */}
        <div className={`w-full h-full rounded-2xl transition-all duration-500 ease-out ${glowClass}`} />

        {/* --- Tooltip (กล่องข้อความ) --- */}
        {/* 🌟 ใช้ clamp() เพื่อให้กล่องยืดหดแบบเนียนๆ ตามขนาดจอ */}
        <div 
          className="pointer-events-none absolute bottom-full rounded-2xl border border-blue-900/10 bg-white/95 text-slate-900 opacity-0 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:opacity-100 z-50 text-center font-sans"
          style={{
            width: 'clamp(140px, 35vw, 224px)', // ความกว้างยืดหดตามจอ (เล็กสุด 140px, ใหญ่สุด 224px)
            padding: 'clamp(8px, 2vw, 16px)',   // ช่องไฟยืดหดตามจอ
            marginBottom: 'clamp(8px, 2vw, 16px)',
            ...tooltipPosStyle
          }}
        >
          
          <p 
            className={`font-extrabold tracking-tight ${accentColor}`}
            style={{ fontSize: 'clamp(11px, 2.5vw, 14px)', marginBottom: 'clamp(4px, 1vw, 6px)' }}
          >
            {label}
          </p>

          <div className="flex flex-col" style={{ gap: 'clamp(4px, 1vw, 8px)' }}>
            <div className="flex justify-between items-center border-b border-slate-100" style={{ paddingBottom: 'clamp(4px, 1vw, 8px)' }}>
              <span className="font-semibold text-slate-400" style={{ fontSize: 'clamp(9px, 2vw, 11px)' }}>
                Real-time
              </span>
              <span className="font-bold text-emerald-600" style={{ fontSize: 'clamp(12px, 3vw, 16px)' }}>
                {realtimeValue?.toFixed(2) ?? '--'}
                <span className="font-medium text-slate-500 ml-1" style={{ fontSize: 'clamp(8px, 1.5vw, 10px)' }}>
                  {unit}
                </span>
              </span>
            </div>
            
            <div className="flex justify-between items-center" style={{ paddingTop: 'clamp(2px, 0.5vw, 4px)' }}>
              <span className="font-semibold text-slate-400" style={{ fontSize: 'clamp(9px, 2vw, 11px)' }}>
                Daily avg
              </span>
              <span className="font-medium text-slate-500" style={{ fontSize: 'clamp(9px, 2vw, 12px)' }}>
                {unit === "pH" ? (label === "pH 1" ? "7.50" : "9.20") : "452.1"} {unit}
              </span>
            </div>
          </div>

          {/* --- ลูกศรชี้ (Triangle) --- */}
          <div 
            className="absolute top-full border-transparent border-t-white/95" 
            style={{
              borderWidth: 'clamp(6px, 1.5vw, 8px)',
              ...arrowStyle
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ===========================================================================
// Main Component: SystemMap
// ===========================================================================

const SystemMap = ({ data, phData }: SystemMapProps) => {
  return (
    <div className="relative w-full h-auto flex justify-center items-start bg-transparent p-0 border-0 shadow-none pointer-events-none">
      <div className="relative inline-block w-full max-w-5xl bg-transparent pointer-events-auto">
        <img
          src="/images/system-diagram.png"
          alt="System Diagram"
          className="block w-full h-auto bg-transparent"
        />

        {/* --- CO2 Sensors --- */}
        <SensorNode
          top={31} left={14.5}
          label="CO₂ Sensor 1"
          realtimeValue={data?.co2_position1_ppm}
          unit="ppm"
          width={115} height={120} offsetTop={20}
        />

        <SensorNode
          top={25} left={54}
          label="CO₂ Sensor 2"
          realtimeValue={data?.co2_position2_ppm}
          unit="ppm"
          width={115} height={120} offsetTop={-20}
        />

        <SensorNode
          top={35} left={94.5}
          label="CO₂ Sensor 3"
          realtimeValue={data?.co2_position3_ppm}
          unit="ppm"
          width={115} height={123} offsetTop={0}
        />

        {/* --- pH Sensors --- */}
        <SensorNode
          top={46.5} left={43.5}
          label="pH 1"
          realtimeValue={phData?.ph_1}
          unit="pH"
          width={80} height={90}
          accentColor="text-blue-900"
        />

        <SensorNode
          top={46.5} left={80}
          label="pH 2"
          realtimeValue={phData?.ph_2}
          unit="pH"
          width={80} height={90}
          accentColor="text-blue-900"
        />
      </div>
    </div>
  );
};

export default SystemMap;