"use client";

export default function Navbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white text-black shadow-md">
      <div className="w-full h-[74px] px-4 sm:px-6 md:px-8 flex items-center justify-between">
        {/* Left: Hamburger */}
        <button
          aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-gray-100"
          onClick={onMenu}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        {/* Center: Title + Subtitle */}
        <div className="flex flex-col items-center text-center leading-tight mx-2">
          <div className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide" style={{ color: "#173ECC" }}>
            IoT Carbon Capture
          </div>
          <div className="text-[9px] sm:text-xs md:text-sm -mt-0.5" style={{ color: "#508ACF" }}>
            Monitoring and controlling CO₂ reduction using wolffia and shells.
          </div>
        </div>

        {/* Right: Logo */}
        <div className="flex items-center">
          <img
            src="/Logo.png"
            alt="Logo"
            className="block h-[36px] w-[36px] sm:h-[40px] sm:w-[40px] md:h-[46px] md:w-[46px] rounded-full object-contain"
          />
        </div>
      </div>
    </header>
  );
}








