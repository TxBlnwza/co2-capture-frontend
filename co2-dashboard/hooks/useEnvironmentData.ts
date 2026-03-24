import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useEnvironmentData() {
  const [data, setData] = useState({
    energy: 0,
    phShells: 0,
    phWolffia: 0,
    solarFront: 0,
    solarRear: 0,
  });

  // กันค่า sensor error (-127)
  const safeTemp = (v: number | null) => {
    if (v === null || v <= -100) return 0;
    return v;
  };

  const fetchData = async () => {
    // 🔋 energy จาก function
    const { data: energyData } = await supabase.rpc(
      "get_daily_energy_total"
    );

    // 📊 latest row
    const { data: latest } = await supabase
      .from("environment_data")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      setData({
        energy: energyData || 0,
        phShells: latest.ph_shells ?? 0,
        phWolffia: latest.ph_wolffia ?? 0,
        solarFront: safeTemp(latest.temp_solar_front),
        solarRear: safeTemp(latest.temp_solar_rear),
      });
    }
  };

  useEffect(() => {
    fetchData();

    // ⚡ realtime
    const channel = supabase
      .channel("env-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "environment_data",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return data;
}