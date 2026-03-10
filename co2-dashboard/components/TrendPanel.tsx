"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { Line } from "react-chartjs-2";
import "@/components/charts/ChartSetup";
import { fetchEfficiencySeries, fetchReducedRaw10mWindow } from "@/lib/efficiency";
import { subscribeCo2Changes } from "@/lib/co2";

// Helpers
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
// time lists
const HOURS_FROM = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
const HOURS_TO = [...Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`), "23:59"];
function parseHHMM(s: string): { h: number; m: number } {
  const [hh, mm] = s.split(":").map((x) => Number(x));
  return { h: isNaN(hh) ? 0 : hh, m: isNaN(mm) ? 0 : mm };
}

type Mode = "day" | "window";

export default function TrendPanel() {
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

  useEffect(() => {
    if (mode !== "window") return;
    if (wDate !== todayISO) {
      setWStart("00:00");
      setWEnd("23:59");
    } else {
      const now = new Date();
      const currentEnd = `${String(now.getHours()).padStart(2, "0")}:00`;
      if (wEnd === "23:59") setWEnd(currentEnd);
    }
  }, [wDate, mode]);

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
      if (to <= from) to.setMinutes(from.getMinutes() + 10);
      return fetchReducedRaw10mWindow(from, to);
    },
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    const unsub = subscribeCo2Changes(() => mutate(swrKey));
    return () => { void unsub(); };
  }, [swrKey]);

  const labels = data?.labels ?? [];
  const rawSeries = mode === "day" ? (data as any)?.reducedSeries ?? [] : (data as any)?.series ?? [];
  const series = rawSeries.map((v: any) => (v != null && v < 0 ? 0 : v));
  const avgReducedOverall = mode === "day" ? ((data as any)?.avgReducedOverall ?? 0) : null;
  const yMax = yMaxNice(series);

  const chart = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: series,
          borderWidth: 2,
          borderColor: "#203F9A", // เปลี่ยนเส้นกราฟเป็นน้ำเงินเข้ม
          backgroundColor: "rgba(32,63,154,0.1)", // พื้นที่ใต้กราฟสีจางลง
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
          spanGaps: true,
        },
      ],
    }),
    [labels, series, mode]
  );

  const chartRef = useRef<any>(null);

  const applyQuickRange = (days: 7 | 14 | 30) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    setRange(days);
    setDayFrom(start);
    setDayTo(end);
  };

  return (
    /* แก้ไข: เปลี่ยน bg เป็น white และ text เป็น #203F9A */
    <div className="relative rounded-[10px] border border-[#C2E3FF] bg-white p-4 text-[#203F9A] shadow-md">
      <div className="mb-2 flex justify-end sm:mb-0 sm:absolute sm:right-4 sm:top-4 sm:z-10">
        <div className="inline-flex overflow-hidden rounded-full border border-[#203F9A]/20">
          <button
            className={`px-3 py-1 text-xs ${mode === "day" ? "bg-[#203F9A]/10" : "bg-transparent hover:bg-[#203F9A]/5"}`}
            onClick={() => setMode("day")}
          >
            Day view
          </button>
          <button
            className={`px-3 py-1 text-xs ${mode === "window" ? "bg-[#203F9A]/10" : "bg-transparent hover:bg-[#203F9A]/5"}`}
            onClick={() => setMode("window")}
          >
            Time view
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-lg font-bold">Daily CO₂ reduction trend :</div>

        {mode === "day" ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium">Date</span>
              <input
                type="date"
                value={toISODate(dayFrom)}
                max={toISODate(dayTo)}
                onChange={(e) => {
                  const d = fromInputDate(e.target.value);
                  if (d > dayTo) setDayTo(d);
                  setDayFrom(d);
                }}
                className="date-input w-full sm:w-auto bg-[#F3FBFF] text-[#203F9A] text-sm border border-[#C2E3FF] rounded-md px-2 py-1 outline-none"
              />
              <span className="text-xs opacity-80">-</span>
              <input
                type="date"
                value={toISODate(dayTo)}
                min={toISODate(dayFrom)}
                onChange={(e) => setDayTo(fromInputDate(e.target.value))}
                className="date-input w-full sm:w-auto bg-[#F3FBFF] text-[#203F9A] text-sm border border-[#C2E3FF] rounded-md px-2 py-1 outline-none"
              />
            </div>
            <div className="text-xs font-semibold sm:text-right">
              Average: {(avgReducedOverall ?? 0).toFixed(2)} ppm/day
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium">Date</span>
              <input
                type="date"
                value={wDate}
                onChange={(e) => setWDate(e.target.value)}
                className="date-input w-full sm:w-auto bg-[#F3FBFF] text-[#203F9A] text-sm border border-[#C2E3FF] rounded-md px-2 py-1 outline-none"
              />
              <span className="text-xs font-medium">From</span>
              <select
                value={wStart}
                onChange={(e) => setWStart(e.target.value)}
                className="time-select w-full sm:w-auto bg-[#F3FBFF] text-[#203F9A] text-sm border border-[#C2E3FF] rounded-md px-2 py-1 outline-none"
              >
                {HOURS_FROM.map((t) => <option key={`sh-${t}`} value={t}>{t}</option>)}
              </select>
              <span className="text-xs font-medium">To</span>
              <select
                value={wEnd}
                onChange={(e) => setWEnd(e.target.value)}
                className="time-select w-full sm:w-auto bg-[#F3FBFF] text-[#203F9A] text-sm border border-[#C2E3FF] rounded-md px-2 py-1 outline-none"
              >
                {HOURS_TO.map((t) => <option key={`eh-${t}`} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="text-xs font-semibold sm:text-right">
              Time range: {wStart} - {wEnd}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 h-56 sm:h-64 lg:h-72 rounded-xl bg-[#F3FBFF] p-3 border border-[#C2E3FF]">
        <Line
          ref={chartRef}
          data={chart}
          options={{
            responsive: true,
            interaction: { mode: "nearest", intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                enabled: true,
                backgroundColor: "rgba(32,63,154,0.9)",
              },
            },
            elements: { point: { radius: 0 } },
            scales: {
              x: { grid: { color: "rgba(32,63,154,0.05)" }, ticks: { color: "#203F9A" } },
              y: {
                min: 0,
                max: yMax,
                ticks: { color: "#203F9A" },
                grid: { color: "rgba(32,63,154,0.05)" },
              },
            },
            maintainAspectRatio: false,
          }}
        />
      </div>

      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {mode === "day" && (
          <div className="inline-flex w-full sm:w-auto overflow-hidden rounded-full border border-[#203F9A]/20">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => applyQuickRange(d as 7 | 14 | 30)}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs ${range === d ? "bg-[#203F9A]/20 font-bold" : "bg-white hover:bg-[#F3FBFF]"}`}
              >
                {d}D
              </button>
            ))}
          </div>
        )}
        <div className="text-[11px] font-medium opacity-80 text-right">
          {mode === "day" ? `Date range: ${fmtRangeText(dayFrom, dayTo)}` : `Time range: ${wStart} - ${wEnd}`}
        </div>
      </div>

      <style jsx global>{`
        .date-input { color-scheme: light; }
        .date-input::-webkit-calendar-picker-indicator {
          filter: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}





