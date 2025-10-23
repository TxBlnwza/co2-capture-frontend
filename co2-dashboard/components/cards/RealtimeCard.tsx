"use client";
import { useEffect, useState } from "react";
import { getLatestCo2, subscribeCo2Latest, Co2Row } from "@/lib/co2";

export default function RealtimeCard({
  title,
  column,          // ชื่อคอลัมน์ใน co2_data เช่น "co2_position1_ppm"
  unit = "ppm",
}: {
  title: string;
  column: keyof Pick<
    Co2Row,
    "co2_position1_ppm" | "co2_position2_ppm" | "co2_position3_ppm"
  >;
  unit?: string;
}) {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const d = await getLatestCo2();
      if (mounted) setValue((d as any)?.[column] ?? null);
    })();
    const unsub = subscribeCo2Latest((r) => {
      setValue((r as any)?.[column] ?? null);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [column]);

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#5EA0EB] to-[#002F93] p-4 text-white shadow-md border-none flex flex-col items-center justify-center">
      <div className="text-sm font-medium text-white">{title}</div>
      <div className="text-2xl font-semibold mt-1">
        {value == null ? "—" : value}
        {unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}

