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

// 1. เพิ่ม Interface เพื่อรับ Props จากหน้าหลัก
interface Co2SummaryProps {
  className?: string;
}

export default function Co2Summary({ className }: Co2SummaryProps) {
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
        label: "CO₂ Sensor 1",
        val: avgP1,
        w: Math.min(100, (avgP1 / MAX_BAR_PPM) * 100),
        color: "#2DD4BF",
      },
      {
        label: "CO₂ Sensor 2",
        val: avgP2,
        w: Math.min(100, (avgP2 / MAX_BAR_PPM) * 100),
        color: "#A855F7",
      },
      {
        label: "CO₂ Sensor 3",
        val: avgP3,
        w: Math.min(100, (avgP3 / MAX_BAR_PPM) * 100),
        color: "#EAB308",
      },
    ],
    [avgP1, avgP2, avgP3]
  );

  const { trendColor, trendLabel } = useMemo(() => {
    if (!yesterdayKg || yesterdayKg <= 0) {
      return {
        trendColor: "#6B7280",
        trendLabel: "0.00% from yesterday",
      };
    }

    const diffPct = ((totalKg - yesterdayKg) / yesterdayKg) * 100;
    const isUp = diffPct > 0;

    const sign = isUp ? "+" : "-";
    const color = isUp ? "#16A34A" : "#DC2626";
    const absPct = Math.abs(diffPct).toFixed(2);

    return {
      trendColor: color,
      trendLabel: `${sign} ${absPct}% from yesterday`,
    };
  }, [totalKg, yesterdayKg]);

  return (
    // 2. ปรับ div นอกสุดให้รับ className และใส่ h-full เพื่อให้ยืดตาม Container พ่อได้
    <div className={`w-full ${className}`}>
      <div className="rounded-3xl bg-gradient-to-r from-[#CDF0FF] to-[#78A9F2] border-[0.5px] border-[#9FD2FE] p-6 text-[#173396] shadow-md w-full h-full flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[#173396]/20" />

          {/* 🔵 ซ้าย: Total KG + เทียบเมื่อวาน */}
          <div className="flex flex-col justify-between h-full">
            <div className="text-lg font-bold mb-2">CO₂ Reduced</div>

            <div className="text-center">
              <div
                className="text-4xl font-bold leading-tight tracking-tight mb-2"
                style={{ color: "#15B10A" }}
              >
                {Number(totalKg).toLocaleString(undefined, {
                  minimumFractionDigits: 8,
                  maximumFractionDigits: 8,
                })}
                <span
                  className="text-base font-semibold ml-1"
                  style={{ color: "#15B10A" }}
                >
                  kgSS
                </span>
              </div>
            </div>

            <div
              className="text-sm font-medium flex items-center gap-2 mt-2"
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
          <div className="flex flex-col justify-between h-full">
            <div className="space-y-4">
              {bars.map((b) => (
                <div key={b.label}>
                  {/* แก้ไขสีข้อความตรงนี้เป็น #FCFFCF */}
                  <div className="flex justify-between text-sm font-medium mb-1" style={{ color: "#FCFFCF" }}>
                    <span>{b.label}</span>
                    <span>{b.val.toFixed(2)} ppm</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#173396]/10 overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-500"
                      style={{ width: `${b.w}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs font-medium opacity-70 self-end">
              Average/Day
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}










