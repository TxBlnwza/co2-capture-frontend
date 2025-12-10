// components/EfficiencyPanel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { Line } from "react-chartjs-2";
import "@/components/charts/ChartSetup";
import { fetchEfficiencySeries, fetchTotalKgRange } from "@/lib/efficiency";
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

export default function EfficiencyPanel({ className = "" }: { className?: string }) {
  // default: 7 วันล่าสุด
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  const [from, setFrom] = useState<Date>(start);
  const [to, setTo] = useState<Date>(today);

  const key = useMemo(() => `eff_series:${toInput(from)}:${toInput(to)}`, [from, to]);

  // โหลดซีรีส์ (% และ ppm/วัน) ตามช่วงวันที่เลือก
  const { data } = useSWR(
    key,
    () => fetchEfficiencySeries(from, to, "Asia/Bangkok"),
    { revalidateOnFocus: false }
  );

  // โหลด total kg ของช่วงวันที่เลือก (ใช้ฟังก์ชัน get_daily_co2_kg_range)
  const { data: totalKgRange } = useSWR(
    `eff_total_kg:${toInput(from)}:${toInput(to)}`,
    () => fetchTotalKgRange(from, to, "Asia/Bangkok"),
    { revalidateOnFocus: false }
  );

  // Realtime → รีเฟรชเมื่อ co2_data เปลี่ยน (เฉพาะซีรีส์ efficiency)
  useEffect(() => {
    const unsub = subscribeCo2Changes(() => mutate(key));
    return () => {
      void unsub();
    };
  }, [key]);

  const labels = data?.labels ?? [];
  const series = data?.effSeries ?? [];
  const overall = data?.overallAvg ?? 0;
  const avgReducedPPM = data?.avgReducedOverall ?? 0;
  const maxDay = data?.maxDay ?? "-";
  const max = data?.max ?? 0;
  const minDay = data?.minDay ?? "-";
  const min = data?.min ?? 0;

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
      className={`
        w-full mx-auto lg:mx-0
        max-w-[420px] lg:max-w-[320px]
        rounded-[10px] border border-white/15
        bg-gradient-to-b from-[#2e61b0]/40 to-[#0b2a60]/40
        p-4 text-white shadow-md
        ${className}
      `}
    >
      {/* ==== Date pickers (อินพุตจริง ไม่มีปุ่มแคปซูล) ==== */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="date"
          aria-label="From date"
          value={toInput(from)}
          max={toInput(to)}
          onChange={(e) => {
            const d = fromInput(e.target.value);
            if (d > to) setTo(d);
            setFrom(d);
          }}
          className="date-input text-xs"
        />
        <span className="text-xs opacity-80">-</span>
        <input
          type="date"
          aria-label="To date"
          value={toInput(to)}
          min={toInput(from)}
          onChange={(e) => setTo(fromInput(e.target.value))}
          className="date-input text-xs"
        />
      </div>

      {/* Chart */}
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
                  title: (items) => labels[items[0]?.dataIndex ?? 0] ?? "",
                  label: (ctx) =>
                    `Avg. Efficiency: ${
                      ctx.parsed?.y == null ? "N/A" : ctx.parsed.y.toFixed(2) + " %"
                    }`,
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
        {/* ✅ Total ของช่วงวันที่เลือก (kg) อยู่ด้านบน Avg / Day */}
        <div className="flex items-center justify-between py-1">
          <span className="opacity-85">Total :</span>
          <span className="font-medium">
            {Number(totalKgRange ?? 0).toLocaleString(undefined, {
              maximumFractionDigits: 6,
            })}{" "}
            kg
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="opacity-85">Avg / Day :</span>
          <span className="font-medium">
            {avgReducedPPM ? `${avgReducedPPM.toFixed(2)} ppm` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="opacity-85">Max day :</span>
          <span className="font-medium">
            {maxDay} - {max}%
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="opacity-85">Min day :</span>
          <span className="font-medium">
            {minDay} - {min}%
          </span>
        </div>
      </div>

      {/* สไตล์อินพุต date ให้มองเห็นชัด (พื้นน้ำเงินเข้ม, ขาว, ไอคอนขาว) */}
      <style jsx>{`
        .date-input {
          background: #123165;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 6px 10px;
          outline: none;
        }
        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.9;
          cursor: pointer;
        }
        .date-input:focus {
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.12);
        }
      `}</style>
    </div>
  );
}









