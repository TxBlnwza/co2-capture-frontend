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
    /* ปรับ Gradient ใหม่, เพิ่มเส้นขอบบางๆ และเปลี่ยนสี Text เป็น #203F9A */
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#F3FBFF] to-[#A7E2FF] border-[0.5px] border-[#C2E3FF] p-4 text-[#203F9A] shadow-md flex flex-col items-center justify-center">
      {/* ปรับ font เป็น font-normal เพื่อให้ตัวหนังสือบางลงตามที่ต้องการ */}
      <div className="text-sm font-normal">{title}</div>
      <div className="text-2xl font-semibold mt-1">
        {value == null ? "—" : value}
        {unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}

