import { supabase } from "@/lib/supabaseClient";

export type EfficiencyPoint = {
  d: string;                     // YYYY-MM-DD
  avg_efficiency: number | null; // % เฉลี่ยรายวัน
  avg_reduced_ppm_day: number | null; // ppm เฉลี่ยรายวัน
};

export async function fetchEfficiencySeries(from: Date, to: Date, tz = "Asia/Bangkok") {
  const { data, error } = await supabase.rpc("get_efficiency_series", {
    p_from: toISODate(from),
    p_to: toISODate(to),
    p_tz: tz,
  });

  if (error) {
    console.error("get_efficiency_series error", error);
    return {
      labels: [],
      effSeries: [],
      reducedSeries: [],
      overallAvg: 0,
      avgReducedOverall: 0,
      maxDay: "",
      max: 0,
      minDay: "",
      min: 0,
    };
  }

  // map รายวัน (ทั้ง % และ ppm)
  const map = new Map<string, { eff: number | null; ppm: number | null }>();
  (data as EfficiencyPoint[]).forEach((r) => {
    map.set(r.d, { eff: r.avg_efficiency, ppm: r.avg_reduced_ppm_day });
  });

  const labels: string[] = [];
  const effSeries: (number | null)[] = [];
  const reducedSeries: (number | null)[] = [];

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = toISODate(d);       // YYYY-MM-DD
    labels.push(fmtTH(d));          // dd/MM
    const rec = map.get(key);
    effSeries.push(rec?.eff ?? null);
    reducedSeries.push(rec?.ppm ?? null);
  }

  // ค่าเฉลี่ยรวมของช่วงที่เลือก (ไม่นับ null)
  const effVals = effSeries.filter((v): v is number => v !== null);
  const ppmVals = reducedSeries.filter((v): v is number => v !== null);

  const overallAvg =
    effVals.length ? +(effVals.reduce((a, b) => a + b, 0) / effVals.length).toFixed(2) : 0;

  const avgReducedOverall =
    ppmVals.length ? +(ppmVals.reduce((a, b) => a + b, 0) / ppmVals.length).toFixed(2) : 0;

  // หา max/min ของ % เพื่อแสดง
  let max = 0,
    min = 0,
    maxDay = "",
    minDay = "";
  if (effSeries.length) {
    let mx = -Infinity,
      mn = Infinity,
      mxIdx = -1,
      mnIdx = -1;
    effSeries.forEach((v, i) => {
      if (v == null) return;
      if (v > mx) {
        mx = v;
        mxIdx = i;
      }
      if (v < mn) {
        mn = v;
        mnIdx = i;
      }
    });
    if (mxIdx >= 0) {
      max = +mx.toFixed(2);
      maxDay = labels[mxIdx];
    }
    if (mnIdx >= 0) {
      min = +mn.toFixed(2);
      minDay = labels[mnIdx];
    }
  }

  return {
    labels,
    effSeries: effSeries.map((v) => (v == null ? null : +(+v).toFixed(2))),
    reducedSeries: reducedSeries.map((v) => (v == null ? null : +(+v).toFixed(2))),
    overallAvg,
    avgReducedOverall, // 👈 ใช้ตัวนี้แสดง Avg / Day (ppm)
    maxDay,
    max,
    minDay,
    min,
  };
}

// helpers
function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fmtTH(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}
// ──────────────────────────────────────────────────────────────
// RAW 10-minute window for "Time window" mode (<= 24 hours)
// ──────────────────────────────────────────────────────────────

export type ReducedRawPoint = { ts: string; v: number | null };

/**
 * ดึงค่าดิบ co2_reduced_ppm_interval ทุก 10 นาทีในช่วงเวลา (จำกัด <= 24 ชม.)
 * คืน labels = HH:mm, series = ค่า ppm (อาจมี null ถ้าไม่มีข้อมูล)
 */
export async function fetchReducedRaw10mWindow(
  from: Date,
  to: Date
): Promise<{ labels: string[]; series: (number | null)[] }> {
  // กันพลาดช่วงเกิน 24 ชม.
  const MAX_MS = 24 * 60 * 60 * 1000;
  const end = new Date(Math.min(to.getTime(), from.getTime() + MAX_MS));

  const { data, error } = await supabase
    .from("co2_data")
    .select("timestamp, co2_reduced_ppm_interval")
    .gte("timestamp", from.toISOString())
    .lte("timestamp", end.toISOString())
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("fetchReducedRaw10mWindow error", error);
    return { labels: [], series: [] };
  }

  const labels: string[] = [];
  const series: (number | null)[] = [];

  (data ?? []).forEach((row: any) => {
    const t = new Date(row.timestamp as string);
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    labels.push(`${hh}:${mm}`);
    series.push(row.co2_reduced_ppm_interval ?? null);
  });

  return { labels, series };
}
