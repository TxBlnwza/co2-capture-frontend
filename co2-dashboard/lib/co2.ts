// lib/co2.ts
import { supabase } from "@/lib/supabaseClient";
import { setLastUpdate } from "@/lib/updateBus";

export const subscribeCo2Latest = subscribeCo2Changes;

export type Co2Row = {
  id: number;
  timestamp: string;
  co2_position1_ppm: number | null;
  co2_position2_ppm: number | null;
  co2_position3_ppm: number | null;
  co2_reduced_ppm_interval: number | null;
  efficiency_percentage: number | null;
};

// แถวล่าสุด (ใช้กับ Position bars / realtime)
export async function getLatestCo2(): Promise<Co2Row | null> {
  const { data, error } = await supabase
    .from("co2_data")
    .select(
      "id,timestamp,co2_position1_ppm,co2_position2_ppm,co2_position3_ppm,co2_reduced_ppm_interval,efficiency_percentage"
    )
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestCo2 error", error);
    return null;
  }

  // แจ้งเวลาอัปเดตล่าสุดเข้าบัส (ให้หน้า UI ไปแสดง)
  setLastUpdate(data?.timestamp ?? null);

  return data;
}

// realtime: ฟังทั้ง INSERT และ UPDATE
export function subscribeCo2Changes(onChange: (row: Co2Row) => void) {
  const channel = supabase
    .channel("co2_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "co2_data" },
      (payload) => {
        const row = payload.new as Co2Row;
        setLastUpdate(row?.timestamp ?? null);
        onChange(row);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

// RPC: get_today_summary()
export type TodaySummary = {
  avg_ppm_reduced: number | null;
  avg_efficiency: number | null;
  total_co2_reduced_kg: number | null;
  avg_position1: number | null;
  avg_position2: number | null;
  avg_position3: number | null;
};

export async function getTodaySummary(): Promise<TodaySummary> {
  const { data, error } = await supabase.rpc("get_today_summary");
  if (error) {
    console.error("getTodaySummary RPC error", error);
    return {
      avg_ppm_reduced: null,
      avg_efficiency: null,
      total_co2_reduced_kg: null,
      avg_position1: null,
      avg_position2: null,
      avg_position3: null,
    };
  }

  const row = Array.isArray(data) ? data[0] : (data as any);

  return {
    avg_ppm_reduced: row?.avg_ppm_reduced ?? null,
    avg_efficiency: row?.avg_efficiency ?? null,
    total_co2_reduced_kg: row?.total_co2_reduced_kg ?? null,
    avg_position1: row?.avg_position1 ?? null,
    avg_position2: row?.avg_position2 ?? null,
    avg_position3: row?.avg_position3 ?? null,
  };
}

// RPC: get_today_total_kg()
export type TodayKg = {
  today_kg: number | null;
};

export async function getTodayTotalKg(): Promise<TodayKg> {
  const { data, error } = await supabase.rpc("get_today_total_kg");
  if (error) {
    console.error("getTodayTotalKg RPC error", error);
    return { today_kg: 0 };
  }

  const row = Array.isArray(data) ? data[0] : (data as any);

  return {
    today_kg: row?.today_kg ?? 0,
  };
}

// รวม kg ของ "เมื่อวาน" (query จาก co2_data ตรง ๆ)
export type DayKg = {
  total_kg: number | null;
};

export async function getYesterdayTotalKg(): Promise<DayKg> {
  const now = new Date();

  // ตั้งช่วงเวลา "เมื่อวาน" ตาม local time (เครื่องผู้ใช้)
  const start = new Date(now);
  start.setDate(now.getDate() - 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setDate(now.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("co2_data")
    .select("co2_reduced_kg")
    .gte("timestamp", start.toISOString())
    .lte("timestamp", end.toISOString());

  if (error) {
    console.error("getYesterdayTotalKg error", error);
    return { total_kg: 0 };
  }

  const rows = (data ?? []) as { co2_reduced_kg: number | null }[];
  const sum = rows.reduce(
    (acc, r) =>
      acc + (typeof r.co2_reduced_kg === "number" ? r.co2_reduced_kg : 0),
    0
  );

  return { total_kg: sum };
}





