import RealtimeCard from "@/components/cards/RealtimeCard";
import RealtimeLine from "@/components/charts/RealtimeLine";
import HourlyPhChart from "@/components/HourlyPhChart";

export default function EnergyPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Energy Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <RealtimeCard title="Power (P)" column="co2_position1_ppm" unit="W" />
        <RealtimeCard title="Voltage (V)" column="co2_position2_ppm" unit="V" />
        <RealtimeCard title="Current (I)" column="co2_position3_ppm" unit="A" />
      </div>
      <RealtimeLine title="Energy Used (Realtime)" endpoint="energy_used" />
      <HourlyPhChart />
    </section>
  );
}
