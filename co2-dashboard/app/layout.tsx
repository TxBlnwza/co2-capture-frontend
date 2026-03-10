import type { Metadata } from "next";
import "./globals.css";
import Shell from "./(shell)/Shell";

export const metadata: Metadata = {
  title: "IoT Carbon Capture",
  description: "Realtime CO₂ & Energy monitoring",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full">
      <body className="relative min-h-screen bg-transparent text-gray-900">
        {/* เลเยอร์พื้นหลังแบบ fixed (แก้เป็นไล่สีสว่างตาม Figma) */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 pointer-events-none
                     bg-fixed bg-no-repeat bg-cover bg-center
                     bg-gradient-to-b from-[#F4F9FF] to-[#E6F2FF]"
        />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}


