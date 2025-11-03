// app/layout.tsx
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
      <body className="relative min-h-screen bg-transparent">
        {/* เลเยอร์พื้นหลังแบบ fixed */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10 pointer-events-none
                     bg-fixed bg-no-repeat bg-cover bg-center
                     bg-gradient-to-b from-[#1D67AC] to-[#10245F]"
        />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}


