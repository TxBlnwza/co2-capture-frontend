// lib/history.ts
import { supabase } from "@/lib/supabaseClient";

export type Co2Row = {
  id: number;
  timestamp: string; // ISO
  co2_position1_ppm: number | null;
  co2_position2_ppm: number | null;
  co2_position3_ppm: number | null;
  co2_reduced_ppm_interval: number | null;
  efficiency_percentage: number | null;
};

export type HistoryQuery = {
  fromISO: string;      // e.g. "2025-10-17T00:00"
  toISO: string;        // e.g. "2025-10-24T23:59"
  sort: "date_asc" | "date_desc";
  search?: string;
  limit?: number;       // optional
};

export async function fetchHistory(q: HistoryQuery) {
  let sel = supabase
    .from("co2_data")
    .select(
      "id,timestamp,co2_position1_ppm,co2_position2_ppm,co2_position3_ppm,co2_reduced_ppm_interval,efficiency_percentage"
    )
    .gte("timestamp", q.fromISO)
    .lte("timestamp", q.toISO);

  sel = q.sort === "date_asc" ? sel.order("timestamp", { ascending: true }) : sel.order("timestamp", { ascending: false });
  if (q.limit) sel = sel.limit(q.limit);

  const { data, error } = await sel;
  if (error) throw error;

  let rows = (data ?? []) as Co2Row[];

  // client-side search (ง่ายและยืดหยุ่น)
  if (q.search && q.search.trim()) {
    const s = q.search.trim().toLowerCase();
    rows = rows.filter((r) => {
      const parts = [
        r.timestamp,
        r.co2_position1_ppm,
        r.co2_position2_ppm,
        r.co2_position3_ppm,
        r.co2_reduced_ppm_interval,
        r.efficiency_percentage,
      ]
        .map((x) => (x == null ? "" : String(x).toLowerCase()))
        .join(" ");
      return parts.includes(s);
    });
  }

  // summary
  const avgEfficiency =
    avg(rows.map((r) => r.efficiency_percentage).filter(isNum)) ?? 0;

  const avgReducedPPM =
    avg(rows.map((r) => r.co2_reduced_ppm_interval).filter(isNum)) ?? 0;

  return { rows, avgEfficiency: round2(avgEfficiency), avgReducedPPM: round2(avgReducedPPM) };
}

function isNum(v: any): v is number {
  return typeof v === "number" && !Number.isNaN(v);
}
function avg(arr: number[]) {
  if (!arr.length) return undefined;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function round2(n: number) { return Math.round(n * 100) / 100; }
