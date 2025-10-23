import RealtimeCard from "@/components/cards/RealtimeCard";
import RealtimeLine from "@/components/charts/RealtimeLine";

export default function EnergyPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Energy Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <RealtimeCard title="Power (P)" valueKey="power_w" unit="W" />
        <RealtimeCard title="Voltage (V)" valueKey="voltage_v" unit="V" />
        <RealtimeCard title="Current (I)" valueKey="current_a" unit="A" />
      </div>
      <RealtimeLine title="Energy Used (Realtime)" topic="energy_used" />
    </section>
  );
}
