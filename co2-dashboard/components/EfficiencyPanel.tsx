"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { Line } from "react-chartjs-2";
import "@/components/charts/ChartSetup";
import { fetchEfficiencySeries } from "@/lib/efficiency";
import { subscribeCo2Changes } from "@/lib/co2";

function fmt(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).toString().slice(-2);
  return `${dd}/${mm}/${yy}`;
}
function toInput(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fromInput(s: string) {
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function EfficiencyPanel({ className = "" }: { className?: string }) {
  // default: 7 วันล่าสุด
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  const [from, setFrom] = useState<Date>(start);
  const [to, setTo] = useState<Date>(today);
  const [openPicker, setOpenPicker] = useState<"from" | "to" | null>(null);

  const key = useMemo(() => `eff_series:${toInput(from)}:${toInput(to)}`, [from, to]);

  // โหลดซีรีส์ (% และ ppm/วัน) ตามช่วงวันที่เลือก
  const { data } = useSWR(
    key,
    () => fetchEfficiencySeries(from, to, "Asia/Bangkok"),
    { revalidateOnFocus: false }
  );

  // Realtime → รีเฟรช
  useEffect(() => {
    const unsub = subscribeCo2Changes(() => mutate(key));
    return () => {
      // Cleanup must be synchronous; ignore the Promise returned by unsub()
      void unsub();
    };
  }, [key]);

  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpenPicker(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const labels = data?.labels ?? [];
  const series = data?.effSeries ?? [];                 // % series สำหรับกราฟ
  const overall = data?.overallAvg ?? 0;                // Average Efficiency %
  const avgReducedPPM = data?.avgReducedOverall ?? 0;   // Avg / Day (ppm)
  const maxDay = data?.maxDay ?? "-";
  const max = data?.max ?? 0;
  const minDay = data?.minDay ?? "-";
  const min = data?.min ?? 0;

  // Chart data
  const chart = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          data: series,
          borderWidth: 2,
          borderColor: "#7EF5B3",
          backgroundColor: "rgba(126,245,179,0.18)",
          spanGaps: true,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [labels, series]);

  const chartRef = useRef<any>(null);

  return (
    <div
      ref={wrapRef}
      className={`
        w-[75%] self-start
        rounded-[10px] border border-white/15
        bg-gradient-to-b from-[#2e61b0]/40 to-[#0b2a60]/40
        p-4 text-white shadow-md
        ${className}
      `}
    >
      {/* Date pills + dropdown pickers */}
      <div className="mb-3 flex items-center gap-2 relative">
        <button
          type="button"
          onClick={() => setOpenPicker(openPicker === "from" ? null : "from")}
          className="rounded-full bg-[#2b65c2] text-white/95 text-xs px-3 py-1 border border-white/20 shadow-sm"
        >
          {fmt(from)}
        </button>
        <span className="text-xs opacity-80">-</span>
        <button
          type="button"
          onClick={() => setOpenPicker(openPicker === "to" ? null : "to")}
          className="rounded-full bg-[#2b65c2] text-white/95 text-xs px-3 py-1 border border-white/20 shadow-sm"
        >
          {fmt(to)}
        </button>

        {/* Picker FROM */}
        {openPicker === "from" && (
          <div className="absolute left-0 top-full mt-2 rounded-xl bg-[#123165] border border-white/20 p-2 shadow-lg">
            <input
              type="date"
              value={toInput(from)}
              max={toInput(to)}
              onChange={(e) => {
                const d = fromInput(e.target.value);
                if (d > to) setTo(d);
                setFrom(d);
                setOpenPicker(null);
              }}
              className="bg-transparent text-white text-sm border border-white/20 rounded-md px-2 py-1"
            />
          </div>
        )}

        {/* Picker TO */}
        {openPicker === "to" && (
          <div className="absolute left-[calc(0.5rem+84px)] top-full mt-2 rounded-xl bg-[#123165] border border-white/20 p-2 shadow-lg">
            <input
              type="date"
              value={toInput(to)}
              min={toInput(from)}
              onChange={(e) => {
                setTo(fromInput(e.target.value));
                setOpenPicker(null);
              }}
              className="bg-transparent text-white text-sm border border-white/20 rounded-md px-2 py-1"
            />
          </div>
        )}
      </div>

      {/* Chart (สูงขึ้น + tooltip popup เมื่อคลิก) */}
      <div className="h-48 rounded-xl bg-white/10 p-2">
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
                titleFont: { weight: "bold" as const },
                padding: 10,
                callbacks: {
                  title: (items) => {
                    const i = items[0]?.dataIndex ?? 0;
                    return labels[i] ?? "";
                  },
                  label: (ctx) => {
                    const y = ctx.parsed?.y;
                    return `Avg. Efficiency: ${y == null ? "N/A" : y.toFixed(2) + " %"}`;
                  },
                },
              },
            },
            elements: { point: { radius: 0 } },
            scales: {
              x: { grid: { color: "rgba(255,255,255,0.08)" }, ticks: { color: "#fff" } },
              y: {
                min: 0,
                max: 100,
                ticks: { color: "#fff", stepSize: 20, callback: (v) => `${v}%` },
                grid: { color: "rgba(255,255,255,0.08)" },
              },
            },
            maintainAspectRatio: false,
            // แสดง tooltip เมื่อคลิก
            onClick: (evt) => {
              const chart = chartRef.current;
              if (!chart) return;
              const points = chart.getElementsAtEventForMode(
                evt,
                "nearest",
                { intersect: false },
                true
              );
              if (!points.length) {
                chart.setActiveElements([]);
                chart.tooltip.setActiveElements([], { x: 0, y: 0 });
                chart.update();
                return;
              }
              const { index, datasetIndex } = points[0];
              const meta = chart.getDatasetMeta(datasetIndex);
              const pt = meta.data[index];
              chart.setActiveElements([{ datasetIndex, index }]);
              chart.tooltip.setActiveElements([{ datasetIndex, index }], { x: pt.x, y: pt.y });
              chart.update();
            },
          }}
        />
      </div>

      {/* Average Efficiency (รวมช่วง) */}
      <div className="mt-4 text-center">
        <div className="text-sm opacity-85 tracking-wide">Average Efficiency :</div>
        <div className="text-3xl font-extrabold text-[#7EF5B3] mt-1">
          {overall}%
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 text-xs">
        <div className="flex items-center justify-between py-1">
          <span className="opacity-85">Avg / Day :</span>
          <span className="font-medium">
            {avgReducedPPM ? `${avgReducedPPM.toFixed(2)} ppm` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="opacity-85">Max day :</span>
          <span className="font-medium">{maxDay} - {max}%</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="opacity-85">Min day :</span>
          <span className="font-medium">{minDay} - {min}%</span>
        </div>
      </div>
    </div>
  );
}







