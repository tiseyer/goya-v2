'use client';

export default function GlobeWireframe() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        viewBox="0 0 800 800"
        className="w-[700px] h-[700px] sm:w-[900px] sm:h-[900px] opacity-[0.04] dark:opacity-[0.06] translate-x-[15%] animate-[spin_120s_linear_infinite]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        {/* Outer circle */}
        <circle cx="400" cy="400" r="350" />

        {/* Latitude lines */}
        <ellipse cx="400" cy="400" rx="350" ry="60" />
        <ellipse cx="400" cy="400" rx="350" ry="140" />
        <ellipse cx="400" cy="400" rx="350" ry="230" />
        <ellipse cx="400" cy="400" rx="350" ry="300" />

        {/* Longitude lines */}
        <ellipse cx="400" cy="400" rx="60" ry="350" />
        <ellipse cx="400" cy="400" rx="140" ry="350" />
        <ellipse cx="400" cy="400" rx="230" ry="350" />
        <ellipse cx="400" cy="400" rx="300" ry="350" />

        {/* Equator */}
        <line x1="50" y1="400" x2="750" y2="400" />

        {/* Prime meridian */}
        <line x1="400" y1="50" x2="400" y2="750" />

        {/* Diagonal cross lines for depth */}
        <ellipse cx="400" cy="400" rx="250" ry="350" transform="rotate(30, 400, 400)" />
        <ellipse cx="400" cy="400" rx="250" ry="350" transform="rotate(-30, 400, 400)" />
      </svg>
    </div>
  );
}
