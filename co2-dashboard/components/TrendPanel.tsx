"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { Line } from "react-chartjs-2";
import "@/components/charts/ChartSetup";
import { fetchEfficiencySeries } from "@/lib/efficiency";
import { subscribeCo2Changes } from "@/lib/co2";

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
function fmtPill(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).toString().slice(-2);
  return `${dd}/${mm}/${yy}`;
}
function fmtRangeText(from: Date, to: Date) {
  const dd = (d: Date) => String(d.getDate()).padStart(2, "0");
  const mm = (d: Date) => String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = (d: Date) => d.getFullYear();
  return `${dd(from)}/${mm(from)}/${yyyy(from)} - ${dd(to)}/${mm(to)}/${yyyy(to)}`;
}
function computeYMax(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v != null);
  if (!nums.length) return 100;
  const max = Math.max(...nums);
  const step = 50;
  return Math.ceil(max / step) * step;
}

export default function TrendPanel() {
  // default 14 วัน
  const today = new Date();
  const start14 = new Date(today);
  start14.setDate(today.getDate() - 13);

  const [from, setFrom] = useState<Date>(start14);
  const [to, setTo] = useState<Date>(today);
  const [openPicker, setOpenPicker] = useState<"from" | "to" | null>(null);
  const [range, setRange] = useState<7 | 14 | 30>(14);

  const key = useMemo(() => `reduced_series:${toInput(from)}:${toInput(to)}`, [from, to]);

  const { data } = useSWR(key, () => fetchEfficiencySeries(from, to, "Asia/Bangkok"), {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    const unsub = subscribeCo2Changes(() => mutate(key));
    return () => { void unsub(); };
  }, [key]);

  const labels = data?.labels ?? [];
  const reducedSeries = data?.reducedSeries ?? [];
  const avgReducedOverall = data?.avgReducedOverall ?? 0;
  const yMax = computeYMax(reducedSeries);

  const applyQuickRange = (days: 7 | 14 | 30) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    setRange(days);
    setFrom(start);
    setTo(end);
    setOpenPicker(null);
  };

  const chart = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data: reducedSeries,
          borderWidth: 2,
          borderColor: "#34d1ff",
          backgroundColor: "rgba(52,209,255,0.18)",
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    }),
    [labels, reducedSeries]
  );

  const chartRef = useRef<any>(null);

  return (
    <div className="rounded-[10px] border border-white/15 bg-white/5 p-4 text-white shadow-md">
      {/* แถวบน: ซ้าย=หัวข้อ + date pickers (ติดกัน) / ขวา=Average */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">Daily CO₂ reduction trend :</div>

          {/* date pickers ติดหลังหัวข้อ */}
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenPicker(openPicker === "from" ? null : "from")}
              className="rounded-full bg-[#295caa] text-white/95 text-xs px-3 py-1 border border-white/20 shadow-sm"
            >
              {fmtPill(from)}
            </button>
            <span className="text-xs opacity-80">-</span>
            <button
              type="button"
              onClick={() => setOpenPicker(openPicker === "to" ? null : "to")}
              className="rounded-full bg-[#295caa] text-white/95 text-xs px-3 py-1 border border-white/20 shadow-sm"
            >
              {fmtPill(to)}
            </button>

            {/* Dropdown FROM */}
            {openPicker === "from" && (
              <div className="absolute left-0 top-full mt-2 rounded-xl bg-[#123165] border border-white/20 p-2 shadow-lg z-10">
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
            {/* Dropdown TO */}
            {openPicker === "to" && (
              <div className="absolute left-[7.5rem] top-full mt-2 rounded-xl bg-[#123165] border border-white/20 p-2 shadow-lg z-10">
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
        </div>

        {/* ขวาบน: ค่าเฉลี่ยช่วง */}
        <div className="text-xs opacity-80">
          Average: <span className="font-semibold">{avgReducedOverall.toFixed(2)} ppm/day</span>
        </div>
      </div>

      {/* กราฟ */}
      <div className="mt-3 h-64 rounded-xl bg-white/10 p-3">
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
                    return `Avg. Reduced: ${y == null ? "N/A" : y.toFixed(2) + " ppm"}`;
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

      {/* แถวล่าง: ซ้าย=ปุ่มช่วงเวลา / ขวา=Date range */}
      <div className="mt-2 flex items-center justify-between">
        {/* ซ้ายสุด: ปุ่ม 7D/14D/30D */}
        <div className="inline-flex overflow-hidden rounded-full border border-white/20">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => applyQuickRange(d as 7 | 14 | 30)}
              className={`px-3 py-1 text-xs ${
                range === d ? "bg-white/25" : "bg-white/10 hover:bg-white/15"
              }`}
            >
              {d}D
            </button>
          ))}
        </div>

        {/* ขวาล่าง: Date range */}
        <div className="text-[11px] opacity-80">
          Date range: {fmtRangeText(from, to)}
        </div>
      </div>
    </div>
  );
}



