"use client";

import { useEffect, useMemo, useState, useRef } from "react"; // 🌟 เพิ่ม useRef
import { supabase } from "@/lib/supabaseClient";
import { toPng } from "html-to-image"; // 🌟 Import html-to-image
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
  Legend, // 🌟 ใช้ Legend ของ recharts
} from "recharts";

type HourlyRow = {
  log_time: string; // timestamptz -> string
  pos1: number | null;
  pos2: number | null;
  pos3: number | null;
};

type UiRange = {
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
};

function toDateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDayLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

function endOfDayLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
}

function formatDateTH(dateStr: string) {
  const d = startOfDayLocal(dateStr);
  return d.toLocaleDateString("th-TH", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Bangkok",
  });
}

function formatDateEN(dateStr: string) {
  const d = startOfDayLocal(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// 🌟 ปรับปรุง Legend ให้เป็นแนวนอน เพื่อใช้โชว์ด้านบนสุดของกราฟ
function DashLegend() {
  return (
    <div className="flex justify-end gap-6 pb-2 pr-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-xl font-bold leading-none select-none" style={{ color: "#60A5FA", marginTop: "-3px" }}>
          —
        </span>
        <span className="text-xs text-black">CO₂ Sensor 1</span>
      </div>
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-xl font-bold leading-none select-none" style={{ color: "#34D399", marginTop: "-3px" }}>
          —
        </span>
        <span className="text-xs text-black">CO₂ Sensor 2</span>
      </div>
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-xl font-bold leading-none select-none" style={{ color: "#F472B6", marginTop: "-3px" }}>
          —
        </span>
        <span className="text-xs text-black">CO₂ Sensor 3</span>
      </div>
    </div>
  );
}

export default function HourlyCo2Chart() {
  const [rows, setRows] = useState<HourlyRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 🌟 บังคับค่าเริ่มต้นเป็น "วันนี้ ย้อนกลับไป 7 วัน" แบบตรงไปตรงมาเลย
  const initialEnd = new Date();
  const initialStart = new Date(initialEnd);
  initialStart.setDate(initialStart.getDate() - 7);

  const initialStartDateStr = toDateInputValue(initialStart);
  const initialEndDateStr = toDateInputValue(initialEnd);

  const [uiRange, setUiRange] = useState<UiRange>({
    startDate: initialStartDateStr,
    endDate: initialEndDateStr,
  });

  const [rangeISO, setRangeISO] = useState<{ startISO: string; endISO: string } | null>({
    startISO: startOfDayLocal(initialStartDateStr).toISOString(),
    endISO: endOfDayLocal(initialEndDateStr).toISOString(),
  });

  const chartRef = useRef<HTMLDivElement>(null);

  // ทุกครั้งที่ rangeISO เปลี่ยน -> เรียก RPC
  useEffect(() => {
    const run = async () => {
      if (!rangeISO) return;
      setLoading(true);

      const { data, error } = await supabase.rpc("get_hourly_co2_snapshot", {
        start_time: rangeISO.startISO,
        end_time: rangeISO.endISO,
      });

      if (error) {
        console.error("RPC error:", error);
        setRows([]);
      } else {
        setRows((data ?? []) as HourlyRow[]);
      }

      setLoading(false);
    };

    run();
  }, [rangeISO]);

  // แปลงข้อมูลให้แกน X เป็นชั่วโมงที่ 1..N
  const chartData = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.log_time).getTime() - new Date(b.log_time).getTime()
    );
    return sorted.map((r, idx) => ({
      ...r,
      hourIndex: idx + 1,
    }));
  }, [rows]);

  const xTicks = useMemo(() => {
    const max = chartData.length;
    if (max <= 1) return max === 1 ? [1] : [];

    const targetTicks = 24; 
    const step = Math.max(1, Math.ceil((max - 1) / targetTicks));

    const ticks: number[] = [];
    for (let v = 1; v <= max; v += step) ticks.push(v);

    if (ticks[ticks.length - 1] !== max) ticks.push(max); 

    return ticks;
  }, [chartData]);

  const quickLast24h = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

    setUiRange({ startDate: toDateInputValue(start), endDate: toDateInputValue(end) });
    setRangeISO({ startISO: start.toISOString(), endISO: end.toISOString() });
  };

  const showAllData = async () => {
    setLoading(true);

    const { data: minData, error: minErr } = await supabase
      .from("co2_data")
      .select("timestamp")
      .order("timestamp", { ascending: true })
      .limit(1);

    const { data: maxData, error: maxErr } = await supabase
      .from("co2_data")
      .select("timestamp")
      .order("timestamp", { ascending: false })
      .limit(1);

    if (minErr || maxErr || !minData?.[0]?.timestamp || !maxData?.[0]?.timestamp) {
      console.error("Cannot load min/max timestamp:", minErr ?? maxErr);
      setLoading(false);
      return;
    }

    const startDate = toDateInputValue(new Date(minData[0].timestamp));
    const endDate = toDateInputValue(new Date(maxData[0].timestamp));

    setUiRange({ startDate, endDate });
    setRangeISO({
      startISO: startOfDayLocal(startDate).toISOString(),
      endISO: endOfDayLocal(endDate).toISOString(),
    });
  };

  const downloadChartAsImage = async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: "#ffffff",
        style: { fontFamily: "sans-serif" }
      });
      
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `co2_chart_${Date.now()}.png`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export chart image", err);
    }
  };

  const dateRangeText = `Date range: ${formatDateEN(uiRange.startDate)} - ${formatDateEN(
    uiRange.endDate
  )}`;

  return (
    <div className="w-full md:w-11/12 max-w-7xl mx-auto rounded-2xl border border-black/10 bg-white p-4">
      {/* Header + filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-3">
        <div>
          <div className="text-[#203F9A] font-semibold text-lg ml-4">Hourly CO₂ Sensor Position Trends</div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600">From</label>
            <input
              type="date"
              value={uiRange.startDate}
              onChange={(e) => {
                const newStart = e.target.value;
                const currentEnd = uiRange.endDate;

                setUiRange((p) => ({ ...p, startDate: newStart }));

                const start = startOfDayLocal(newStart);
                const end = endOfDayLocal(currentEnd);

                const startISO = (start <= end ? start : end).toISOString();
                const endISO = (start <= end ? end : start).toISOString();

                setRangeISO({ startISO, endISO });
              }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600">To</label>
            <input
              type="date"
              value={uiRange.endDate}
              onChange={(e) => {
                const newEnd = e.target.value;
                const currentStart = uiRange.startDate;

                setUiRange((p) => ({ ...p, endDate: newEnd }));

                const start = startOfDayLocal(currentStart);
                const end = endOfDayLocal(newEnd);

                const startISO = (start <= end ? start : end).toISOString();
                const endISO = (start <= end ? end : start).toISOString();

                setRangeISO({ startISO, endISO });
              }}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
            />
          </div>

          <button
            onClick={quickLast24h}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 hover:bg-slate-50"
          >
            Last 24 hr
          </button>

          <button
            onClick={downloadChartAsImage}
            className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Chart
          </button>
        </div>
      </div>

      <div
        ref={chartRef}
        className="h-[340px] select-none relative bg-white"
        onMouseDown={(e) => e.preventDefault()}
        style={{ outline: "none" }}
      >
        <div
          className="absolute z-10 text-xs text-slate-600"
          style={{
            right: 18,
            bottom: 6,
            background: "rgba(255,255,255,0.65)",
            borderRadius: 8,
            padding: "4px 8px",
            pointerEvents: "none",
          }}
        >
          {dateRangeText}
        </div>

        {loading ? (
          <div className="h-full grid place-items-center text-slate-500 text-sm">
            Loading chart...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 22, left: 18, bottom: 36 }}>
              <CartesianGrid horizontal={false} vertical={false} />

              {/* 🌟 ใช้ Legend ของ Recharts แทน DIV แบบ Absolute */}
              <Legend verticalAlign="top" content={<DashLegend />} />

              <XAxis
                dataKey="hourIndex"
                ticks={xTicks} 
                tick={{ fill: "rgba(15,23,42,0.85)", fontSize: 12 }}
                stroke="rgba(15,23,42,0.35)"
                allowDecimals={false}
                interval="preserveStartEnd"
                minTickGap={10}
              >
                <Label
                  value="Hour (hr)"
                  position="insideBottom"
                  offset={-18}
                  fill="#000"
                  style={{ fontSize: 12 }}
                />
              </XAxis>

              <YAxis
                domain={[0, 1100]}
                ticks={[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100]} 
                tick={{ fill: "rgba(15,23,42,0.85)", fontSize: 12 }}
                stroke="rgba(15,23,42,0.35)"
              >
                <Label
                  value="CO₂ Concentration (ppm)"
                  angle={-90}
                  position="insideLeft"
                  offset={-10}
                  dy={12}
                  textAnchor="middle"
                  fill="#000"
                  style={{ fontSize: 12 }}
                />
              </YAxis>

              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 12,
                  color: "#0f172a",
                }}
                labelStyle={{ color: "#0f172a" }}
                formatter={(value, name) => [value, name]}
                labelFormatter={(label, payload) => {
                  if (!payload?.[0]?.payload?.log_time) return `Hour : ${label}`;
                  const d = new Date(payload[0].payload.log_time);
                  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  return `${dateStr} ${timeStr} (Hour ${label})`;
                }}
              />

              <Line
                type="monotone"
                dataKey="pos1"
                name="CO₂ Sensor 1"
                stroke="#60A5FA"
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="pos2"
                name="CO₂ Sensor 2"
                stroke="#34D399"
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="pos3"
                name="CO₂ Sensor 3"
                stroke="#F472B6"
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}