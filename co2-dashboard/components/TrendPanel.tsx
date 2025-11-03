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

  // ปรับเวลาอัตโนมัติเมื่อเปลี่ยนวันใน time view
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wDate, mode]);

  // SWR key & fetcher
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

  // Chart data
  const labels = data?.labels ?? [];
  const rawSeries =
    mode === "day" ? (data as any)?.reducedSeries ?? [] : (data as any)?.series ?? [];
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
          borderColor: mode === "day" ? "#34d1ff" : "#7EF5B3",
          backgroundColor: mode === "day" ? "rgba(52,209,255,0.18)" : "rgba(126,245,179,0.18)",
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
      {/* ปุ่มโหมด: บนมือถือให้อยู่ใน flow, บนจอ >=sm ให้ไปชิดขวาบน */}
      <div className="mb-2 flex justify-end sm:mb-0 sm:absolute sm:right-4 sm:top-4 sm:z-10">
        <div className="inline-flex overflow-hidden rounded-full border border-white/25">
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
      </div>

      {/* หัวข้อ + คอนโทรล (responsive) */}
      <div className="flex flex-col gap-3">
        <div className="text-lg font-semibold">Daily CO₂ reduction trend :</div>

        {mode === "day" ? (
          // --- DAY VIEW ---
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* controls ซ้าย: ทำให้ input กว้างเต็มบนมือถือ */}
            <div className="flex flex-wrap items-center gap-2">
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
                className="date-input w-full sm:w-auto bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
              />
              <span className="text-xs opacity-80">-</span>
              <input
                type="date"
                value={toISODate(dayTo)}
                min={toISODate(dayFrom)}
                onChange={(e) => setDayTo(fromInputDate(e.target.value))}
                className="date-input w-full sm:w-auto bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
              />
            </div>

            {/* ขวา: Average */}
            <div className="text-xs opacity-80 sm:text-right">
              Average:{" "}
              <span className="font-semibold">
                {(avgReducedOverall ?? 0).toFixed(2)} ppm/day
              </span>
            </div>
          </div>
        ) : (
          // --- TIME VIEW ---
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs opacity-85">Date</span>
              <input
                type="date"
                value={wDate}
                onChange={(e) => setWDate(e.target.value)}
                className="date-input w-full sm:w-auto bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
              />

              <span className="text-xs opacity-85">From</span>
              <select
                value={wStart}
                onChange={(e) => setWStart(e.target.value)}
                className="time-select w-full sm:w-auto bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
                aria-label="Start time"
              >
                {HOURS_FROM.map((t) => (
                  <option key={`sh-${t}`} value={t}>{t}</option>
                ))}
              </select>

              <span className="text-xs opacity-85">To</span>
              <select
                value={wEnd}
                onChange={(e) => setWEnd(e.target.value)}
                className="time-select w-full sm:w-auto bg-[#0b254f] text-white text-sm border border-white/20 rounded-md px-2 py-1"
                aria-label="End time"
              >
                {HOURS_TO.map((t) => (
                  <option key={`eh-${t}`} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="text-xs opacity-80 sm:text-right">
              Time range: <span className="font-semibold">{wStart} - {wEnd}</span>
            </div>
          </div>
        )}
      </div>

      {/* กราฟ — สูงขึ้นบนจอใหญ่, ยืดเต็มกว้างบนมือถือ */}
      <div className="mt-3 h-56 sm:h-64 lg:h-72 rounded-xl bg-white/10 p-3">
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
                displayColors: false,
                backgroundColor: "rgba(0,0,0,0.85)",
                titleColor: "#fff",
                bodyColor: "#fff",
                padding: 10,
                callbacks: {
                  title: (items) => labels[items[0].dataIndex] ?? "",
                  label: (ctx) => {
                    const y = ctx.parsed?.y;
                    return `${mode === "day" ? "Avg. Reduced" : "Reduced"}: ${
                      y == null ? "N/A" : y.toFixed(2) + " ppm"
                    }`;
                  },
                },
              },
            },
            elements: { point: { radius: 0 } },
            scales: {
              x: { grid: { color: "rgba(255,255,255,0.08)" }, ticks: { color: "#fff" } },
              y: {
                min: 0,
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
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* ซ้าย: 7D/14D/30D */}
          <div className="inline-flex w-full sm:w-auto overflow-hidden rounded-full border border-white/20">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => applyQuickRange(d as 7 | 14 | 30)}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs ${range === d ? "bg-white/25" : "bg-white/10 hover:bg-white/15"}`}
              >
                {d}D
              </button>
            ))}
          </div>
          {/* ขวา: Date range */}
          <div className="text-[11px] opacity-80 text-right">
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

      {/* ทำให้ date picker icon เป็นสีขาว + รองรับธีมเข้ม/มือถือ */}
      <style jsx global>{`
        /* ให้ native date input ดูเข้ากับธีมมืด และทำไอคอนปฏิทินเป็นสีขาว */
        .date-input {
          color-scheme: white;
        }
        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1) brightness(2);
          cursor: pointer;
        }
        /* บางเบราว์เซอร์ */
        input[type="date"]::-ms-clear,
        input[type="date"]::-ms-reveal {
          display: none;
        }
        /* ป้องกัน wrap เพี้ยนบนมือถือ */
        @media (max-width: 640px) {
          .time-select,
          .date-input {
            min-width: 140px;
          }
        }
      `}</style>
    </div>
  );
}





