"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { Line } from "react-chartjs-2";
import "@/components/charts/ChartSetup";
import { fetchEfficiencySeries, fetchReducedRaw10mWindow } from "@/lib/efficiency";
import { subscribeCo2Changes } from "@/lib/co2";

// 🧩 Helper functions
function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fromInputDate(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}
function fmtRangeText(from: Date, to: Date) {
  const dd = (d: Date) => String(d.getDate()).padStart(2, "0");
  const mm = (d: Date) => String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = (d: Date) => d.getFullYear();
  return `${dd(from)}/${mm(from)}/${yyyy(from)} - ${dd(to)}/${mm(to)}/${yyyy(to)}`;
}
function yMaxNice(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v != null);
  if (!nums.length) return 100;
  const max = Math.max(...nums.map((v) => Math.max(0, v)));
  const step = 50;
  return Math.ceil(max / step) * step;
}
// รายชั่วโมงสำหรับ FROM
const HOURS_FROM = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
// รายชั่วโมงสำหรับ TO + ปิดท้าย 23:59
const HOURS_TO = [...Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`), "23:59"];

// แปลง "HH:MM" -> {h, m}
function parseHHMM(s: string): { h: number; m: number } {
  const [hh, mm] = s.split(":").map((x) => Number(x));
  return { h: isNaN(hh) ? 0 : hh, m: isNaN(mm) ? 0 : mm };
}

type Mode = "day" | "window";

export default function TrendPanel() {
  // Default 14 วันล่าสุด
  const today = new Date();
  const todayISO = toISODate(today);
  const start14 = new Date(today);
  start14.setDate(today.getDate() - 13);

  const [mode, setMode] = useState<Mode>("day");

  // Day view
  const [dayFrom, setDayFrom] = useState<Date>(start14);
  const [dayTo, setDayTo] = useState<Date>(today);
  const [range, setRange] = useState<7 | 14 | 30>(14);

  // Time view
  const [wDate, setWDate] = useState<string>(todayISO);
  const [wStart, setWStart] = useState<string>("00:00");
  const [wEnd, setWEnd] = useState<string>(() => {
    const hh = String(today.getHours()).padStart(2, "0");
    return `${hh}:00`;
  });

  // เมื่อผู้ใช้เปลี่ยนวันที่ใน Time view:
  // - ถ้าไม่ใช่วันนี้ → เซ็ต 00:00 - 23:59 อัตโนมัติ
  // - ถ้าเป็นวันนี้ → ถ้าปัจจุบันตั้งไว้ 00:00-23:59 จะอัปเดตปลายทางเป็นชั่วโมงปัจจุบัน
  useEffect(() => {
    if (mode !== "window") return;
    if (wDate !== todayISO) {
      setWStart("00:00");
      setWEnd("23:59");
    } else {
      // กรณีย้อนกลับมาเลือก "วันนี้"
      const currentEnd = `${String(new Date().getHours()).padStart(2, "0")}:00`;
      if (wEnd === "23:59") setWEnd(currentEnd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wDate, mode]);

  // Data fetch
  const swrKey = useMemo(() => {
    if (mode === "day") return `reduced_series:day:${toISODate(dayFrom)}:${toISODate(dayTo)}`;
    return `reduced_series:win:${wDate}:${wStart}-${wEnd}`;
  }, [mode, dayFrom, dayTo, wDate, wStart, wEnd]);

  const { data } = useSWR(
    swrKey,
    async () => {
      if (mode === "day") {
        return fetchEfficiencySeries(dayFrom, dayTo, "Asia/Bangkok");
      }
      const base = fromInputDate(wDate);
      const { h: sh, m: sm } = parseHHMM(wStart);
      const { h: eh, m: em } = parseHHMM(wEnd);
      const from = new Date(base);
      from.setHours(sh, sm, 0, 0);
      const to = new Date(base);
      to.setHours(eh, em, 0, 0);
      // บังคับให้ to > from
      if (to <= from) {
        // ถ้า user เลือกเวลาเดียวกัน เช่น 23:59-23:59 ให้ขยับไปอีก 10 นาที
        to.setMinutes(from.getMinutes() + 10);
      }
      return fetchReducedRaw10mWindow(from, to);
    },
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    const unsub = subscribeCo2Changes(() => mutate(swrKey));
    return () => { void unsub(); };
  }, [swrKey]);

  // Chart data
  const labels = data?.labels ?? [];
  const rawSeries = mode === "day" ? data?.reducedSeries ?? [] : data?.series ?? [];
  const series = rawSeries.map((v) => (v != null && v < 0 ? 0 : v)); // ตัดค่าติดลบ
  const avgReducedOverall = mode === "day" ? data?.avgReducedOverall ?? 0 : null;
  const yMax = yMaxNice(series);

  const chart = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: series,
          borderWidth: 2,
          borderColor: "#34d1ff",
          backgroundColor: "rgba(52,209,255,0.18)",
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
          spanGaps: true,
        },
      ],
    }),
    [labels, series]
  );

  const chartRef = useRef<any>(null);

  // Quick range (Day view)
  const applyQuickRange = (days: 7 | 14 | 30) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    setRange(days);
    setDayFrom(start);
    setDayTo(end);
  };

  return (
    <div className="relative rounded-[10px] border border-white/15 bg-white/5 p-4 text-white shadow-md">
      {/* ปุ่มโหมด */}
      <div className="absolute right-4 top-4 inline-flex overflow-hidden rounded-full border border-white/25 z-10">
        <button
          className={`px-3 py-1 text-xs ${mode === "day" ? "bg-white/25" : "bg-transparent hover:bg-white/10"}`}
          onClick={() => setMode("day")}
        >
          Day view
        </button>
        <button
          className={`px-3 py-1 text-xs ${mode === "window" ? "bg-white/25" : "bg-transparent hover:bg-white/10"}`}
          onClick={() => setMode("window")}
        >
          Time view
        </button>
      </div>

      {/* หัวข้อ + คอนโทรล */}
      <div className="flex flex-col gap-2">
        <div className="text-lg font-semibold">Daily CO₂ reduction trend :</div>

        {mode === "day" ? (
          // --- DAY VIEW ---
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs opacity-85">Date</span>
              <input
                type="date"
                value={toISODate(dayFrom)}
                max={toISODate(dayTo)}
                onChange={(e) => {
                  const d = fromInputDate(e.target.value);
                  if (d > dayTo) setDayTo(d);
                  setDayFrom(d);
                }}
                className="bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
              />
              <span className="text-xs opacity-80">-</span>
              <input
                type="date"
                value={toISODate(dayTo)}
                min={toISODate(dayFrom)}
                onChange={(e) => setDayTo(fromInputDate(e.target.value))}
                className="bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
              />
            </div>

            <div className="text-xs opacity-80 text-right">
              Average: <span className="font-semibold">{(avgReducedOverall ?? 0).toFixed(2)} ppm/day</span>
            </div>
          </div>
        ) : (
          // --- TIME VIEW ---
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs opacity-85">Date</span>
              <input
                type="date"
                value={wDate}
                onChange={(e) => setWDate(e.target.value)}
                className="bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
              />

              <span className="text-xs opacity-85">From</span>
              <select
                value={wStart}
                onChange={(e) => setWStart(e.target.value)}
                className="bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
              >
                {HOURS_FROM.map((t) => (
                  <option key={`sh-${t}`} value={t}>{t}</option>
                ))}
              </select>

              <span className="text-xs opacity-85">To</span>
              <select
                value={wEnd}
                onChange={(e) => setWEnd(e.target.value)}
                className="bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
              >
                {HOURS_TO.map((t) => (
                  <option key={`eh-${t}`} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="text-xs opacity-80 text-right">
              Time range: <span className="font-semibold">{wStart} - {wEnd}</span>
            </div>
          </div>
        )}
      </div>

      {/* กราฟ */}
      <div className="mt-3 h-64 rounded-xl bg-white/10 p-3">
        <Line
          ref={chartRef}
          data={{
            labels,
            datasets: [
              {
                data: series,
                borderWidth: 2,
                borderColor: "#34d1ff",
                backgroundColor: "rgba(52,209,255,0.18)",
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4,
                spanGaps: true,
              },
            ],
          }}
          options={{
            responsive: true,
            interaction: { mode: "nearest", intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                displayColors: false,
                backgroundColor: "rgba(0,0,0,0.85)",
                titleColor: "#fff",
                bodyColor: "#fff",
                padding: 10,
                callbacks: {
                  title: (items) => labels[items[0].dataIndex] ?? "",
                  label: (ctx) => {
                    const y = ctx.parsed?.y;
                    return `Avg. Reduced: ${y == null ? "N/A" : y.toFixed(2) + " ppm"}`;
                  },
                },
              },
            },
            elements: { point: { radius: 0 } },
            scales: {
              x: { grid: { color: "rgba(255,255,255,0.08)" }, ticks: { color: "#fff" } },
              y: {
                min: 0, // เริ่มที่ 0 เสมอ
                max: yMax,
                ticks: { color: "#fff" },
                grid: { color: "rgba(255,255,255,0.08)" },
              },
            },
            maintainAspectRatio: false,
          }}
        />
      </div>

      {/* ส่วนล่าง */}
      {mode === "day" ? (
        <div className="mt-2 flex items-center justify-between">
          {/* ซ้าย: 7D/14D/30D */}
          <div className="inline-flex overflow-hidden rounded-full border border-white/20">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => applyQuickRange(d as 7 | 14 | 30)}
                className={`px-3 py-1 text-xs ${range === d ? "bg-white/25" : "bg-white/10 hover:bg-white/15"}`}
              >
                {d}D
              </button>
            ))}
          </div>
          {/* ขวา: Date range */}
          <div className="text-[11px] opacity-80">
            Date range: {fmtRangeText(dayFrom, dayTo)}
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-end">
          <div className="text-[11px] opacity-80">
            Time range: {wStart} - {wEnd}
          </div>
        </div>
      )}

      {/* แก้สี dropdown */}
      <style jsx global>{`
        select,
        select option {
          color: #fff !important;
          background: #0b254f !important;
        }
      `}</style>
    </div>
  );
}





