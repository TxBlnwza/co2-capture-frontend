"use client";

import { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabaseClient";

// --- Helper Functions ---
function toLocalInput(dt: Date) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function fmtDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

const hourOptions = Array.from({ length: 24 }, (_, i) => i);
const minuteOptions = [0, 10, 20, 30, 40, 50];

type Props = { open: boolean; onClose: () => void };

export default function HistoryEnergy({ open, onClose }: Props) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);

  const [isInitialized, setIsInitialized] = useState(false);

  const [fromISO, setFromISO] = useState(toLocalInput(start));
  const [toISO, setToISO] = useState(toLocalInput(now));
  const [sort, setSort] = useState<"date_desc" | "date_asc">("date_desc");

  const [fromDate, setFromDate] = useState(fromISO.slice(0, 10));
  const [fromHour, setFromHour] = useState(parseInt(fromISO.slice(11, 13), 10));
  const [fromMinute, setFromMinute] = useState(0);

  const [toDate, setToDate] = useState(toISO.slice(0, 10));
  const [toHour, setToHour] = useState(parseInt(toISO.slice(11, 13), 10));
  const [toMinute, setToMinute] = useState(0);

  // 🌟 ล็อค Scroll ของ body เมื่อ Popup เปิด 🌟
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Cleanup function คืนค่าเมื่อ component ถูก unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // --- ฟังก์ชันช่วยเหลือสำหรับตั้งค่า State ของวันที่ทั้งหมด ---
  const setDateRangeStates = (startDate: Date, endDate: Date) => {
    const from = toLocalInput(startDate);
    const to = toLocalInput(endDate);
    setFromISO(from);
    setToISO(to);
    setFromDate(from.slice(0, 10));
    setFromHour(startDate.getHours());
    setFromMinute(
      minuteOptions.reduce((p, c) =>
        Math.abs(c - startDate.getMinutes()) < Math.abs(p - startDate.getMinutes()) ? c : p
      , 0)
    );
    setToDate(to.slice(0, 10));
    setToHour(endDate.getHours());
    setToMinute(
      minuteOptions.reduce((p, c) =>
        Math.abs(c - endDate.getMinutes()) < Math.abs(p - endDate.getMinutes()) ? c : p
      , 0)
    );
  };

  // 🌟 ดึงวันที่ล่าสุดที่มีข้อมูลในฐานข้อมูลเมื่อเปิด Modal 🌟
  useEffect(() => {
    if (open && !isInitialized) {
      const initDates = async () => {
        const { data, error } = await supabase
          .from("environment_data")
          .select("timestamp")
          .order("timestamp", { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          // ถ้ามีข้อมูล ให้เซ็ตจากวันล่าสุดที่มี ย้อนกลับไป 7 วัน
          const latest = new Date(data[0].timestamp);
          const startDt = new Date(latest);
          startDt.setDate(latest.getDate() - 7);
          setDateRangeStates(startDt, latest);
        } else {
          // ถ้าไม่มีข้อมูลเลย ให้เซ็ตจากวันปัจจุบัน
          const endDt = new Date();
          const startDt = new Date();
          startDt.setDate(endDt.getDate() - 7);
          setDateRangeStates(startDt, endDt);
        }
        setIsInitialized(true);
      };
      initDates();
    } else if (!open) {
      // รีเซ็ตเมื่อปิด เพื่อให้เช็คข้อมูลล่าสุดใหม่ทุกครั้งที่เปิด
      setIsInitialized(false);
    }
  }, [open, isInitialized]);

  const updateFromISO = (dateStr: string, h: number, m: number) => {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const iso = `${dateStr}T${hh}:${mm}`;
    setFromISO(iso);

    const f = new Date(iso);
    const t = new Date(`${toDate}T${toHour}:${toMinute}`);
    if (f > t) {
      setToDate(dateStr);
      setToHour(h);
      setToMinute(m);
      setToISO(iso);
    }
  };

  const updateToISO = (dateStr: string, h: number, m: number) => {
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const iso = `${dateStr}T${hh}:${mm}`;
    setToISO(iso);

    const t = new Date(iso);
    const f = new Date(`${fromDate}T${fromHour}:${fromMinute}`);
    if (t < f) {
      setFromDate(dateStr);
      setFromHour(h);
      setFromMinute(m);
      setFromISO(iso);
    }
  };

  // 1) ดึงข้อมูลประวัติจาก Supabase โดยจะดึงก็ต่อเมื่อ Initialization เสร็จแล้ว
  const fetchKey = open && isInitialized ? `env_history:${fromISO}:${toISO}:${sort}` : null;
  const { data: rows = [], isLoading } = useSWR(fetchKey, async () => {
    const { data, error } = await supabase
      .from("environment_data")
      .select("*")
      .gte("timestamp", new Date(fromISO).toISOString())
      .lte("timestamp", new Date(toISO).toISOString())
      .order("timestamp", { ascending: sort === "date_asc" });
    if (error) throw error;
    return data;
  }, { revalidateOnFocus: false });

  // 2) ดึงค่าเฉลี่ย
  const avgKey = open && isInitialized ? `env_avg:${fromISO}:${toISO}` : null;
  const { data: avgData, isLoading: isLoadingAvg } = useSWR(avgKey, async () => {
    const { data, error } = await supabase.rpc("get_average_ph", {
      start_time: new Date(fromISO).toISOString(),
      end_time: new Date(toISO).toISOString(),
    });
    if (error) throw error;
    return data?.[0] || { avg_ph_wolffia: 0, avg_ph_shells: 0 };
  }, { revalidateOnFocus: false });

  // 🌟 3) คำนวณผลรวมพลังงานจาก rows ที่โหลดมาได้เลย
  const totalEnergy = useMemo(() => {
    if (!rows || rows.length === 0) return 0;
    return rows.reduce((sum: number, r: any) => sum + (r.energy_wh_interval || 0), 0);
  }, [rows]);

  const setQuick = (days: 7 | 14 | 30 | "today") => {
    const end = new Date();
    let start = new Date(end);
    if (days === "today") start.setHours(0, 0, 0, 0);
    else start.setDate(end.getDate() - (days - 1));
    setDateRangeStates(start, end);
  };

  const downloadCSV = () => {
    const header = [
      "Date",
      "Time",
      "pH Wolffia",
      "pH Shells",
      "Solar Front Temp (°C)",
      "Solar Rear Temp (°C)",
      "Energy Used (kWh)"
    ];

    const lines = rows.map((r: any) => {
      const dt = new Date(r.timestamp);
      // จัดการค่า -127 ให้เป็น 0.0 ตามที่ระบุ
      const sf = r.temp_solar_front === -127 ? "0.0" : (r.temp_solar_front?.toFixed(1) ?? "");
      const sr = r.temp_solar_rear === -127 ? "0.0" : (r.temp_solar_rear?.toFixed(1) ?? "");
      const en = r.energy_wh_interval?.toFixed(4) ?? "";

      return [
        fmtDate(dt),
        fmtTime(dt),
        r.ph_wolffia?.toFixed(2) ?? "",
        r.ph_shells?.toFixed(2) ?? "",
        sf,
        sr,
        en 
      ].join(",");
    });

    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `env_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-2">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-4xl mx-auto my-6 rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#0B2A60] text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" fill="none">
              <path d="M12 8v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M21 12a9 9 0 1 1-3.8-7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="text-xl font-semibold">Environment History Logs</div>
          </div>

          <button className="rounded-full p-2 hover:bg-white/10" onClick={onClose}>
            <svg width="22" height="22" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-end gap-3 rounded-xl border bg-white border-slate-300 px-4 py-3 shadow-sm">
              <div className="flex flex-col">
                <label className="text-sm text-slate-600">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    updateFromISO(e.target.value, fromHour, fromMinute);
                  }}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-slate-600">Time</label>
                <div className="flex items-center gap-2">
                  <select
                    value={fromHour}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    onChange={(e) => {
                      const h = parseInt(e.target.value, 10);
                      setFromHour(h);
                      updateFromISO(fromDate, h, fromMinute);
                    }}
                  >
                    {hourOptions.map((h) => <option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
                  </select>
                  :
                  <select
                    value={fromMinute}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10);
                      setFromMinute(m);
                      updateFromISO(fromDate, fromHour, m);
                    }}
                  >
                    {minuteOptions.map((m) => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-3 rounded-xl border bg-white border-slate-300 px-4 py-3 shadow-sm">
              <div className="flex flex-col">
                <label className="text-sm text-slate-600">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  onChange={(e) => {
                    setToDate(e.target.value);
                    updateToISO(e.target.value, toHour, toMinute);
                  }}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-slate-600">Time</label>
                <div className="flex items-center gap-2">
                  <select
                    value={toHour}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    onChange={(e) => {
                      const h = parseInt(e.target.value, 10);
                      setToHour(h);
                      updateToISO(toDate, h, toMinute);
                    }}
                  >
                    {hourOptions.map((h) => <option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
                  </select>
                  :
                  <select
                    value={toMinute}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10);
                      setToMinute(m);
                      updateToISO(toDate, toHour, m);
                    }}
                  >
                    {minuteOptions.map((m) => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-end rounded-xl border bg-white border-slate-300 px-4 py-3 shadow-sm">
              <div className="flex flex-col">
                <label className="text-sm text-slate-600">Sort by</label>
                <select
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                >
                  <option value="date_desc">Date ↓</option>
                  <option value="date_asc">Date ↑</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Zone */}
        <div className="px-4 pb-2 pt-0 overflow-x-auto overflow-y-auto" style={{ maxHeight: "55vh" }}>
          <table className="w-full min-w-[750px] text-sm border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="shadow-[0_2px_0_rgba(0,0,0,0.06)]">
                <th className="p-2 bg-white border-b text-left rounded-l-md text-slate-900">Date</th>
                <th className="p-2 bg-white border-b text-left text-slate-900">Time</th>
                {/* 🌟 เอาสีออกจากหัวตาราง */}
                <th className="p-2 bg-white border-b text-right text-slate-900">pH Wolffia</th>
                <th className="p-2 bg-white border-b text-right text-slate-900">pH Shells</th>
                <th className="p-2 bg-white border-b text-right text-slate-900">Solar Front (°C)</th>
                <th className="p-2 bg-white border-b text-right text-slate-900">Solar Rear (°C)</th>
                <th className="p-2 bg-white border-b text-right rounded-r-md text-slate-900">Energy (Wh)</th>
              </tr>
            </thead>

            <tbody>
              {(!isInitialized || isLoading) ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="p-2">
                        <div className="h-4 rounded bg-slate-200 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-slate-500">
                    No records found in this range
                  </td>
                </tr>
              ) : (
                rows.map((r: any) => {
                  const dt = new Date(r.timestamp);
                  return (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50">
                      <td className="p-2">{fmtDate(dt)}</td>
                      <td className="p-2 font-medium">{fmtTime(dt)}</td>
                      <td className="p-2 text-right">{r.ph_wolffia?.toFixed(2) ?? "-"}</td>
                      <td className="p-2 text-right">{r.ph_shells?.toFixed(2) ?? "-"}</td>
                      <td className="p-2 text-right">{r.temp_solar_front === -127 ? "0.0" : (r.temp_solar_front?.toFixed(1) ?? "-")}</td>
                      <td className="p-2 text-right">{r.temp_solar_rear === -127 ? "0.0" : (r.temp_solar_rear?.toFixed(1) ?? "-")}</td>
                      {/* 🌟 เอาสีเขียวออกจากข้อมูลพลังงาน */}
                      <td className="p-2 text-right font-semibold">{r.energy_wh_interval?.toFixed(4) ?? "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 text-xs rounded-md border"
              onClick={() => setQuick("today")}
            >
              Today
            </button>
            <div className="inline-flex overflow-hidden rounded-full border">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setQuick(d as 7 | 14 | 30)}
                  className="px-3 py-1 text-xs hover:bg-slate-200"
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
            <div>
              <span className="opacity-70 mr-1">Avg pH Wolffia:</span>
              {/* 🌟 เอาสีออกจากข้อความสรุป */}
              <span className="font-semibold text-slate-900">
                {(!isInitialized || isLoadingAvg) ? "..." : (avgData?.avg_ph_wolffia?.toFixed(2) || "0.00")}
              </span>
            </div>

            <div>
              <span className="opacity-70 mr-1">Avg pH Shells:</span>
              <span className="font-semibold text-slate-900">
                {(!isInitialized || isLoadingAvg) ? "..." : (avgData?.avg_ph_shells?.toFixed(2) || "0.00")}
              </span>
            </div>

            {/* 🌟 เพิ่ม Total Energy ตรงนี้ ถัดจาก Avg pH Shells */}
            <div>
              <span className="opacity-70 mr-1">Total Energy:</span>
              <span className="font-semibold text-slate-900">
                {(!isInitialized || isLoading) ? "..." : `${totalEnergy.toFixed(4)} Wh`}
              </span>
            </div>
          </div>

          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1 text-sm border border-slate-300 hover:bg-slate-100"
          >
            <svg width="16" height="16" fill="none">
              <path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}