"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Co2Row,
  getLatestCo2,
  subscribeCo2Changes,
  getTodaySummary,
  TodaySummary,
} from "@/lib/co2";

const MAX_BAR_PPM = 1000; // สเกลกราฟแท่ง

export default function Co2Summary() {
  const [row, setRow] = useState<Co2Row | null>(null);

  // โหลดครั้งแรก + realtime (INSERT/UPDATE)
  useEffect(() => {
    let mounted = true;

    (async () => {
      const d = await getLatestCo2();
      if (mounted) setRow(d);
    })();

    const unsub = subscribeCo2Changes((r) => {
      setRow(r);          // อัปเดตแท่ง/ตำแหน่ง
      mutate("today_summary"); // สั่ง SWR RPC รีเฟรชเลขใหญ่ + % Today
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // RPC summary วันนี้ (เลขใหญ่ + % Today)
  const { data: summary } = useSWR<TodaySummary>(
    "today_summary",
    getTodaySummary,
    { revalidateOnFocus: false }
  );

  const total = summary?.avg_ppm_reduced ?? 0;   // CO₂ Reduced
  const todayPct = summary?.avg_efficiency ?? 0; // 72% Today

  const p1 = row?.co2_position1_ppm ?? 0;
  const p2 = row?.co2_position2_ppm ?? 0;
  const p3 = row?.co2_position3_ppm ?? 0;

  const bars = useMemo(
    () => [
      { label: "Position 1", val: p1, w: Math.min(100, (p1 / MAX_BAR_PPM) * 100) },
      { label: "Position 2", val: p2, w: Math.min(100, (p2 / MAX_BAR_PPM) * 100) },
      { label: "Position 3", val: p3, w: Math.min(100, (p3 / MAX_BAR_PPM) * 100) },
    ],
    [p1, p2, p3]
  );

  return (
    <div className="w-full md:w-4/5 mx-auto">
      {/* ไล่สีซ้าย→ขวา, กรอบขาว 0.5px, มุม 10px, ไม่มีเงา */}
      <div className="rounded-[10px] bg-gradient-to-r from-[#5B8DD7] to-[#103E81] border border-white border-[0.5px] p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />

          {/* ซ้าย: ชื่อ + ตัวเลข + % Today */}
          <div className="flex flex-col justify-between h-full">
            <div className="text-sm opacity-90">CO₂ Reduced</div>

            <div className="text-center">
              <div className="text-5xl font-extrabold leading-tight">
                {Number(total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                <span className="text-lg font-semibold opacity-90"> ppm</span>
              </div>
            </div>

            <div className="text-sm opacity-90 flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-white/80" />
              {Number(todayPct).toLocaleString(undefined, { maximumFractionDigits: 2 })}% Today
            </div>
          </div>

          {/* ขวา: แท่ง Position 1–3 (สเกลเต็ม 1000 ppm) */}
          <div className="flex flex-col">
            <div className="space-y-3">
              {bars.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs opacity-90 mb-1">
                    <span>{b.label}</span>
                    <span>{b.val} ppm</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white/90 transition-[width] duration-500"
                      style={{ width: `${b.w}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs opacity-80 self-end">Average/Day</div>
          </div>
        </div>
      </div>
    </div>
  );
}







