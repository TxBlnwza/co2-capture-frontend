"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Co2Row,
  getLatestCo2,
  subscribeCo2Changes,
  getTodaySummary,
  getTodayTotalKg,
  getYesterdayTotalKg,
  TodaySummary,
  TodayKg,
  DayKg,
} from "@/lib/co2";

const MAX_BAR_PPM = 1000;

export default function Co2Summary() {
  const [row, setRow] = useState<Co2Row | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const d = await getLatestCo2();
      if (mounted) setRow(d);
    })();

    const unsub = subscribeCo2Changes((r) => {
      setRow(r);
      mutate("today_summary");
      mutate("today_total_kg");
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const { data: summary } = useSWR<TodaySummary>(
    "today_summary",
    getTodaySummary,
    { revalidateOnFocus: false }
  );

  const { data: todayKg } = useSWR<TodayKg>(
    "today_total_kg",
    getTodayTotalKg,
    { revalidateOnFocus: false }
  );

  const { data: yesterdayKgData } = useSWR<DayKg>(
    "yesterday_total_kg",
    getYesterdayTotalKg,
    { revalidateOnFocus: false }
  );

  const avgP1 = summary?.avg_position1 ?? 0;
  const avgP2 = summary?.avg_position2 ?? 0;
  const avgP3 = summary?.avg_position3 ?? 0;

  const totalKg = todayKg?.today_kg ?? 0;
  const yesterdayKg = yesterdayKgData?.total_kg ?? 0;

  const bars = useMemo(
    () => [
      {
        label: "Position 1",
        val: avgP1,
        w: Math.min(100, (avgP1 / MAX_BAR_PPM) * 100),
        color: "#5CE1E6",
      },
      {
        label: "Position 2",
        val: avgP2,
        w: Math.min(100, (avgP2 / MAX_BAR_PPM) * 100),
        color: "#C77DFF",
      },
      {
        label: "Position 3",
        val: avgP3,
        w: Math.min(100, (avgP3 / MAX_BAR_PPM) * 100),
        color: "#edf4b0ff",
      },
    ],
    [avgP1, avgP2, avgP3]
  );

  // ⭐ คำนวณ % เทียบเมื่อวาน + ใส่ช่องว่างหลังเครื่องหมาย
  const { trendColor, trendLabel } = useMemo(() => {
    if (!yesterdayKg || yesterdayKg <= 0) {
      return {
        trendColor: "#D1D5DB",
        trendLabel: "0.00% vs yesterday",
      };
    }

    const diffPct = ((totalKg - yesterdayKg) / yesterdayKg) * 100;
    const isUp = diffPct > 0;

    const sign = isUp ? "+" : "-";
    const color = isUp ? "#C6FFB2" : "#e32424ff"; // เขียว / แดง
    const absPct = Math.abs(diffPct).toFixed(2);

    return {
      trendColor: color,
      trendLabel: `${sign} ${absPct}% from yesterday`, // 👈 เพิ่มช่องว่างหลังเครื่องหมาย
    };
  }, [totalKg, yesterdayKg]);

  return (
    <div className="w-full md:w-4/5 mx-auto">
      <div className="rounded-[10px] bg-gradient-to-r from-[#5B8DD7] to-[#103E81] border border-white border-[0.5px] p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />

          {/* 🔵 ซ้าย: Total KG + เทียบเมื่อวาน */}
          <div className="flex flex-col justify-between h-full">
            <div className="text-sm opacity-90">CO₂ Reduced</div>

            <div className="text-center">
              <div
                className="text-3xl font-bold leading-tight tracking-tight"
                style={{ color: "#abf9abff" }}
              >
                {Number(totalKg).toLocaleString(undefined, {
                  minimumFractionDigits: 8,
                  maximumFractionDigits: 8,
                })}
                <span
                  className="text-base font-semibold opacity-90 ml-1"
                  style={{ color: "#abf9abff" }}
                >
                  kg
                </span>
              </div>
            </div>

            <div
              className="text-sm opacity-90 flex items-center gap-2"
              style={{ color: trendColor }}
            >
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: trendColor }}
              />
              {trendLabel}
            </div>
          </div>

          {/* 🔵 ขวา: 3 Bars เฉลี่ย/วัน */}
          <div className="flex flex-col">
            <div className="space-y-3">
              {bars.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs opacity-90 mb-1">
                    <span>{b.label}</span>
                    <span>{b.val.toFixed(2)} ppm</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-500"
                      style={{ width: `${b.w}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-xs opacity-80 self-end">
              Average/Day
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}












