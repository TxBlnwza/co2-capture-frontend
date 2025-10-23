"use client";
import useSWR from "swr";
import { getLatestCo2, subscribeCo2Changes, Co2Row } from "@/lib/co2";

export default function RealtimeCard({
  title, endpoint, unit
}: { title: string; endpoint: string; unit?: string }) {
  const { data, isLoading, error } = useSWR<{ value:number }>(
    endpoint, axiosFetcher, { refreshInterval: 3000, revalidateOnFocus: false }
  );
  const val = data?.value;

  return (
    <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-white shadow-md">
      <div className="text-sm opacity-80">{title}</div>
      <div className="text-3xl font-bold mt-1">
        {error ? "ERR" : isLoading ? "…" : (val ?? 0)}
        <span className="text-base font-semibold opacity-90 ml-1">{unit}</span>
      </div>
    </div>
  );
}

