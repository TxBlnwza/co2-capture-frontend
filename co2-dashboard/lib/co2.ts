// lib/co2.ts
import { supabase } from "@/lib/supabaseClient";
import { setLastUpdate } from "@/lib/updateBus";   // 👈 เพิ่มบรรทัดนี้
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

// แถวล่าสุด (ใช้กับ Position bars)
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

  // 👇 แจ้งเวลาอัปเดตล่าสุดเข้าบัส (ให้หน้า UI ไปแสดง)
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
        setLastUpdate(row?.timestamp ?? null); // 👈 อัปเดตเวลาเมื่อมีข้อมูลใหม่
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
};

export async function getTodaySummary(): Promise<TodaySummary> {
  const { data, error } = await supabase.rpc("get_today_summary");
  if (error) {
    console.error("getTodaySummary RPC error", error);
    return { avg_ppm_reduced: null, avg_efficiency: null };
  }
  const row = Array.isArray(data) ? data[0] : (data as any);
  return {
    avg_ppm_reduced: row?.avg_ppm_reduced ?? null,
    avg_efficiency: row?.avg_efficiency ?? null,
  };
}



