"use client";

import { useState } from "react";
import Co2Summary from "@/components/Co2Summary";
import EfficiencyPanel from "@/components/EfficiencyPanel";
import RealtimeCard from "@/components/cards/RealtimeCard";
import TrendPanel from "@/components/TrendPanel";
import HistoryModal from "@/components/history/HistoryModal";

export default function CO2Page() {
  const [openHistory, setOpenHistory] = useState(false);

  const now = new Date();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");

  return (
    <>
      <section className="space-y-6">
        {/* Top bar: Update time + View history (popup) */}
        <div className="w-full md:w-4/5 mx-auto flex items-center justify-between">
          <div className="text-sm text-white/80">
            Update at : {hh} : {mm} : {ss}
          </div>

          <button
            onClick={() => setOpenHistory(true)}
            className="rounded-full bg-white/15 px-4 py-2 text-sm text-white border border-white/20 hover:bg-white/25"
          >
            View history
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-4">
          <div className="lg:col-span-2 lg:row-span-1">
            <Co2Summary />
          </div>

          <div className="lg:col-start-3 lg:row-span-2 h-full [&>*]:h-full">
            <EfficiencyPanel />
          </div>

          <div className="lg:col-span-2 lg:row-start-2">
            <div className="w-full md:w-4/5 mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RealtimeCard title="Position 1" column="co2_position1_ppm" />
                <RealtimeCard title="Position 2" column="co2_position2_ppm" />
                <RealtimeCard title="Position 3" column="co2_position3_ppm" />
              </div>
            </div>
          </div>
        </div>

        <TrendPanel />
      </section>

      {/* Popup History */}
      {openHistory && (
        <HistoryModal open={openHistory} onClose={() => setOpenHistory(false)} />
      )}
    </>
  );
}



