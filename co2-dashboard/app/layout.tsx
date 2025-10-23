import type { Metadata } from "next";
import "./globals.css";
import Shell from "./(shell)/Shell";

export const metadata: Metadata = {
  title: "IoT Carbon Capture",
  description: "Realtime CO₂ & Energy monitoring",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body><Shell>{children}</Shell></body>
    </html>
  );
}

