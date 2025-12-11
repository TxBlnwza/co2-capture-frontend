"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetchHistory, fetchTotalKgInRange } from "@/lib/history";

function toLocalInput(dt: Date) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

// เดือน/วัน/ปี
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

export default function HistoryModal({ open, onClose }: Props) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 7);

  const [fromISO, setFromISO] = useState(toLocalInput(start));
  const [toISO, setToISO] = useState(toLocalInput(now));
  const [sort, setSort] = useState<"date_desc" | "date_asc">("date_desc");

  const [fromDate, setFromDate] = useState(fromISO.slice(0, 10));
  const [fromHour, setFromHour] = useState(parseInt(fromISO.slice(11, 13), 10));
  const [fromMinute, setFromMinute] = useState(
    minuteOptions.reduce(
      (prev, cur) =>
        Math.abs(cur - parseInt(fromISO.slice(14, 16), 10)) <
        Math.abs(prev - parseInt(fromISO.slice(14, 16), 10))
          ? cur
          : prev,
      0
    )
  );

  const [toDate, setToDate] = useState(toISO.slice(0, 10));
  const [toHour, setToHour] = useState(parseInt(toISO.slice(11, 13), 10));
  const [toMinute, setToMinute] = useState(
    minuteOptions.reduce(
      (prev, cur) =>
        Math.abs(cur - parseInt(toISO.slice(14, 16), 10)) <
        Math.abs(prev - parseInt(toISO.slice(14, 16), 10))
          ? cur
          : prev,
      0
    )
  );

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

  const key = useMemo(
    () => (open ? `history:${fromISO}:${toISO}:${sort}` : null),
    [open, fromISO, toISO, sort]
  );

  const { data, isLoading } = useSWR(
    key,
    () =>
      fetchHistory({
        fromISO: new Date(fromISO).toISOString(),
        toISO: new Date(toISO).toISOString(),
        sort,
      }),
    { revalidateOnFocus: false }
  );

  const rows = data?.rows ?? [];
  const avgReduced = data?.avgReducedPPM ?? 0;

  // total kg SWR
  const totalKey = useMemo(
    () =>
      open ? `history_total:${fromISO.slice(0, 10)}:${toISO.slice(0, 10)}` : null,
    [open, fromISO, toISO]
  );

  const { data: totalKg, isLoading: isLoadingTotal } = useSWR(
    totalKey,
    () =>
      fetchTotalKgInRange({
        fromISO,
        toISO,
        tz: "Asia/Bangkok",
      }),
    { revalidateOnFocus: false }
  );

  const setQuick = (days: 7 | 14 | 30 | "today") => {
    const end = new Date();
    let start = new Date(end);
    if (days === "today") start.setHours(0, 0, 0, 0);
    else start.setDate(end.getDate() - (days - 1));

    const from = toLocalInput(start);
    const to = toLocalInput(end);

    setFromISO(from);
    setToISO(to);
    setFromDate(from.slice(0, 10));
    setFromHour(start.getHours());
    setFromMinute(
      minuteOptions.reduce((p, c) =>
        Math.abs(c - start.getMinutes()) < Math.abs(p - start.getMinutes())
          ? c
          : p
      , 0)
    );
    setToDate(to.slice(0, 10));
    setToHour(end.getHours());
    setToMinute(
      minuteOptions.reduce((p, c) =>
        Math.abs(c - end.getMinutes()) < Math.abs(p - end.getMinutes()) ? c : p
      , 0)
    );
  };

  // ✅ CSV export: เพิ่มคอลัมน์ CO2 Reduced (kg) + แก้ type ของ avgRow
  const downloadCSV = () => {
    const header = [
      "Date",
      "Time",
      "Position1(ppm)",
      "Position2(ppm)",
      "Position3(ppm)",
      "CO2 Reduced (ppm)",
      "CO2 Reduced (kg)",             // ✅ new column
      "Efficiency (%)",
      "Avg CO2 Reduced (ppm) ",
    ];

    const lines = rows.map((r) => {
      const dt = new Date(r.timestamp);

      // สำหรับแสดงใน CSV (string หรือ number)
      const p1 = r.co2_position1_ppm ?? "";
      const p2 = r.co2_position2_ppm ?? "";
      const p3 = r.co2_position3_ppm ?? "";
      const reduced = r.co2_reduced_ppm_interval ?? "";

      // ค่า kg แสดงเป็นทศนิยม 8 ตำแหน่ง
      const reducedKg =
        r.co2_reduced_kg != null ? Number(r.co2_reduced_kg).toFixed(8) : "";

      const effRaw = r.efficiency_percentage ?? null;
      const eff =
        effRaw != null ? (effRaw ).toFixed(2) + "%" : "";

      // ใช้ number ล้วน ๆ สำหรับคำนวณ avgRow เพื่อเลี่ยง union type
      const p1n = r.co2_position1_ppm;
      const p2n = r.co2_position2_ppm;
      const p3n = r.co2_position3_ppm;

      const avgRow =
        p1n != null && p2n != null && p3n != null
          ? Math.round(((p1n + p2n + p3n) / 3) * 100) / 100
          : "";

      return [
        fmtDate(dt),
        fmtTime(dt),
        p1,
        p2,
        p3,
        reduced,
        reducedKg,  // ✅ put kg into CSV row
        eff,
        avgRow,
      ].join(",");
    });

    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `co2_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto px-2">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-4xl mx-auto my-6 rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between bg-[#0B2A60] text-white px-6 py-4">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" fill="none">
              <path
                d="M12 8v5l3 2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M21 12a9 9 0 1 1-3.8-7.4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-xl font-semibold">CO₂ Reduced history</div>
          </div>

          <button className="rounded-full p-2 hover:bg-white/10" onClick={onClose}>
            <svg width="22" height="22" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* filters */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap items-end gap-4">
            {/* From */}
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
                    {hourOptions.map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2,"0")}</option>
                    ))}
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
                    {minuteOptions.map((m) => (
                      <option key={m} value={m}>{String(m).padStart(2,"0")}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* To */}
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
                    {hourOptions.map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2,"0")}</option>
                    ))}
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
                    {minuteOptions.map((m) => (
                      <option key={m} value={m}>{String(m).padStart(2,"0")}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sort */}
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

        {/* table zone */}
        <div
          className="px-4 pb-2 pt-0 overflow-x-auto overflow-y-auto"
          style={{ maxHeight: "55vh" }}
        >
          <table className="w-full min-w-[750px] text-sm border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="shadow-[0_2px_0_rgba(0,0,0,0.06)]">
                <th className="p-2 bg-white border-b text-left rounded-l-md">
                  Date
                </th>
                <th className="p-2 bg-white border-b text-left">Time</th>
                <th className="p-2 bg-white border-b text-right">
                  Position 1 CO₂ (ppm)
                </th>
                <th className="p-2 bg-white border-b text-right">
                  Position 2 CO₂ (ppm)
                </th>
                <th className="p-2 bg-white border-b text-right">
                  Position 3 CO₂ (ppm)
                </th>
                <th className="p-2 bg-white border-b text-right">
                  CO₂ Reduced (ppm)
                </th>
                <th className="p-2 bg-white border-b text-right rounded-r-md">
                  CO₂ Reduced (Kg)
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
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
                    No data
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const dt = new Date(r.timestamp);

                  return (
                    <tr key={r.id} className="odd:bg-white even:bg-slate-50">
                      <td className="p-2">{fmtDate(dt)}</td>
                      <td className="p-2">{fmtTime(dt)}</td>
                      <td className="p-2 text-right">
                        {r.co2_position1_ppm ?? "-"}
                      </td>
                      <td className="p-2 text-right">
                        {r.co2_position2_ppm ?? "-"}
                      </td>
                      <td className="p-2 text-right">
                        {r.co2_position3_ppm ?? "-"}
                      </td>
                      <td className="p-2 text-right">
                        {r.co2_reduced_ppm_interval ?? "-"}
                      </td>
                      <td className="p-2 text-right">
                        {r.co2_reduced_kg != null
                          ? Number(r.co2_reduced_kg).toFixed(8)
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
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
              <span className="opacity-70 mr-1">Total CO₂ Reduced (kg):</span>
              <span className="font-semibold">
                {isLoadingTotal
                  ? "Loading..."
                  : `${(totalKg ?? 0).toFixed(8)} kg`}
              </span>
            </div>

            <div>
              <span className="opacity-70 mr-1">Avg CO₂ Reduced (ppm):</span>
              <span className="font-semibold">{avgReduced.toFixed(2)} ppm</span>
            </div>
          </div>

          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1 text-sm border border-slate-300 hover:bg-slate-100"
          >
            <svg width="16" height="16" fill="none">
              <path
                d="M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}











