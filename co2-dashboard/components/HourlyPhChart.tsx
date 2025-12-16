"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
} from "recharts";

type HourlyPhRow = {
  log_time: string; // timestamptz -> string
  ph_wolffia: number | null;
  ph_shells: number | null;
};

type UiRange = {
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
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
function formatDateEN(dateStr: string) {
  const d = startOfDayLocal(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// legend แบบเดียวกับของ CO2 (overlay มุมขวาบน)
function DashLegendPh() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-base leading-none select-none" style={{ color: "#60A5FA" }}>
          -
        </span>
        <span className="text-xs text-black">Wolffia </span>
      </div>
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-base leading-none select-none" style={{ color: "#F472B6" }}>
          -
        </span>
        <span className="text-xs text-black">Shells </span>
      </div>
    </div>
  );
}

export default function HourlyPhChart() {
  const [rows, setRows] = useState<HourlyPhRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [rangeISO, setRangeISO] = useState<{ startISO: string; endISO: string } | null>(null);

  const [uiRange, setUiRange] = useState<UiRange>({
    startDate: toDateInputValue(new Date()),
    endDate: toDateInputValue(new Date()),
  });

  // 1) default: หา min/max timestamp เพื่อโชว์ “ทั้งหมด” เหมือน CO2
  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // ✅ เปลี่ยนเป็นตารางของคุณ: environment_data
      const { data: minData, error: minErr } = await supabase
        .from("environment_data")
        .select("timestamp")
        .order("timestamp", { ascending: true })
        .limit(1);

      const { data: maxData, error: maxErr } = await supabase
        .from("environment_data")
        .select("timestamp")
        .order("timestamp", { ascending: false })
        .limit(1);

      if (minErr || maxErr || !minData?.[0]?.timestamp || !maxData?.[0]?.timestamp) {
        console.error("Cannot load min/max timestamp:", minErr ?? maxErr);

        const today = toDateInputValue(new Date());
        setUiRange({ startDate: today, endDate: today });
        setRangeISO({
          startISO: startOfDayLocal(today).toISOString(),
          endISO: endOfDayLocal(today).toISOString(),
        });
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

    init();
  }, []);

  // 2) เรียก RPC ตามช่วงวันที่ (เหมือน CO2)
  useEffect(() => {
    const run = async () => {
      if (!rangeISO) return;
      setLoading(true);

      const { data, error } = await supabase.rpc("get_hourly_ph_snapshot", {
        start_time: rangeISO.startISO,
        end_time: rangeISO.endISO,
      });

      if (error) {
        console.error("RPC error:", error);
        setRows([]);
      } else {
        // บางที numeric อาจส่งมาเป็น string -> แปลงให้ชัวร์
        const mapped = (data ?? []).map((r: any) => ({
          log_time: r.log_time,
          ph_wolffia: r.ph_wolffia == null ? null : Number(r.ph_wolffia),
          ph_shells: r.ph_shells == null ? null : Number(r.ph_shells),
        })) as HourlyPhRow[];

        setRows(mapped);
      }

      setLoading(false);
    };

    run();
  }, [rangeISO]);

  // X = hourIndex 1..N เหมือน CO2
  const chartData = useMemo(() => {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.log_time).getTime() - new Date(b.log_time).getTime()
    );
    return sorted.map((r, idx) => ({ ...r, hourIndex: idx + 1 }));
  }, [rows]);

  // ticks แบบเดียวกับ CO2 (ละเอียด + กันค่าขวาสุดหาย)
  const xTicks = useMemo(() => {
    const max = chartData.length;
    if (max <= 1) return max === 1 ? [1] : [];

    const targetTicks = 24; // ✅ ละเอียดขึ้น
    const step = Math.max(1, Math.ceil((max - 1) / targetTicks));

    const ticks: number[] = [];
    for (let v = 1; v <= max; v += step) ticks.push(v);

    if (ticks[ticks.length - 1] !== max) ticks.push(max); // ✅ บังคับให้มีค่าตัวสุดท้าย

    return ticks;
  }, [chartData]);

  const applyDateRange = () => {
    const start = startOfDayLocal(uiRange.startDate);
    const end = endOfDayLocal(uiRange.endDate);
    const startISO = (start <= end ? start : end).toISOString();
    const endISO = (start <= end ? end : start).toISOString();
    setRangeISO({ startISO, endISO });
  };

  const quickLast24h = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    setUiRange({ startDate: toDateInputValue(start), endDate: toDateInputValue(end) });
    setRangeISO({ startISO: start.toISOString(), endISO: end.toISOString() });
  };

  const dateRangeText = `Date range: ${formatDateEN(uiRange.startDate)} - ${formatDateEN(uiRange.endDate)}`;

  const yTicks = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];

  return (
    <div className="w-full md:w-11/12 max-w-7xl mx-auto rounded-2xl border border-black/10 bg-white p-4">
      {/* Header + filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-3">
        <div className="text-slate-900 font-semibold">Hourly pH Trends </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600">From</label>
            <input
              type="date"
              value={uiRange.startDate}
              onChange={(e) => {
                // ✅ ทำให้เหมือนไฟล์ที่ 2
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
        </div>
      </div>

      {/* Chart */}
      <div className="h-[340px] select-none relative" onMouseDown={(e) => e.preventDefault()} style={{ outline: "none" }}>
        {/* Legend overlay */}
        <div
          className="absolute z-10"
          style={{
            top: 18,
            right: 18,
            background: "rgba(255,255,255,0.75)",
            borderRadius: 10,
            padding: "8px 10px",
            pointerEvents: "none",
          }}
        >
          <DashLegendPh />
        </div>

        {/* Date range overlay */}
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
          <div className="h-full grid place-items-center text-slate-500 text-sm">Loading chart...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 22, left: 18, bottom: 36 }}>
              <CartesianGrid horizontal={false} vertical={false} />

              <XAxis
                dataKey="hourIndex"
                ticks={xTicks}
                tick={{ fill: "rgba(15,23,42,0.85)", fontSize: 12 }}
                stroke="rgba(15,23,42,0.35)"
                allowDecimals={false}
                interval={0} 
                minTickGap={10}
              >
                <Label value="Hour (hr)" position="insideBottom" offset={-18} fill="#000" style={{ fontSize: 12 }} />
              </XAxis>

              {/* ✅ แกน Y = pH 1-14 */}
              <YAxis
                domain={[1, 14]}
                ticks={yTicks}
                tick={{ fill: "rgba(15,23,42,0.85)", fontSize: 12 }}
                stroke="rgba(15,23,42,0.35)"
                allowDecimals={false}
              >
                <Label
                  value="pH"
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
                labelFormatter={(label) => `Hour : ${label}`}
              />

              <Line
                type="monotone"
                dataKey="ph_wolffia"
                name="Wolffia "
                stroke="#60A5FA"
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="ph_shells"
                name="Shells "
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
