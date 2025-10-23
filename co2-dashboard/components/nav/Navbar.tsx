"use client";

export default function Navbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white text-black shadow-md">
      <div className="max-w-7xl mx-auto h-[74px] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Hamburger (ใหญ่ขึ้น 15%) */}
        <button
          aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-gray-100"
          onClick={onMenu}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        {/* Center: Title + subtitle (เปลี่ยนสีตามที่กำหนด) */}
        <div className="text-center leading-tight">
          <div className="text-2xl font-extrabold tracking-wide" style={{ color: "#173ECC" }}>
            IoT Carbon Capture
          </div>
          <div className="text-xs -mt-1" style={{ color: "#508ACF" }}>
            Monitoring and controlling CO₂ reduction using wolffia and shells.
          </div>
        </div>

        {/* Right: Logo (ใหญ่ขึ้น 15% และชิดขวา) */}
        <div className="flex items-center">
          <img
            src="/Logo.png"
            alt="Logo"
            className="block h-[46px] w-[46px] rounded-full object-contain"
          />
        </div>
      </div>
    </header>
  );
}







