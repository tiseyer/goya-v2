'use client';

interface GOYABadgeProps {
  acronym: string;
  lines?: string[];
  size?: number;
}

export default function GOYABadge({ acronym, lines = [], size = 160 }: GOYABadgeProps) {
  // Sanitize acronym for use as SVG id
  const safeId = `goya-arc-${acronym.replace(/[^a-zA-Z0-9]/g, '')}-${size}`;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.465;
  const textR  = size * 0.395;
  const innerR = size * 0.355;

  // Full-circle arc path starting at the top, going clockwise.
  // We use a near-closed arc (offset by 0.01) to avoid SVG degenerate arc.
  const arcPath = `M ${cx},${cy - textR} A ${textR},${textR} 0 1,1 ${(cx - 0.01).toFixed(3)},${cy - textR}`;

  // Scale font sizes with badge size
  const ringFontSize    = size * 0.058;
  const ringLetterSpace = size * 0.02;

  const acronymFontSize =
    acronym.length <= 2 ? size * 0.24 :
    acronym.length <= 3 ? size * 0.20 :
    acronym.length <= 4 ? size * 0.17 :
    acronym.length <= 6 ? size * 0.135 :
                          size * 0.105;

  const subFontSize  = size * 0.062;
  const lineHeight   = subFontSize * 1.35;

  // Vertical layout: push acronym up when there are sub-lines
  const totalSubHeight = lines.length * lineHeight;
  const blockHeight    = acronymFontSize * 0.75 + totalSubHeight;
  const startY         = cy - blockHeight / 2 + acronymFontSize * 0.75;

  const strokeWidth    = Math.max(2, size * 0.018);
  const innerStroke    = Math.max(1, size * 0.008);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`GOYA ${acronym} designation badge`}
    >
      <defs>
        <path id={safeId} d={arcPath} />
      </defs>

      {/* Outer circle */}
      <circle
        cx={cx} cy={cy} r={outerR}
        fill="#f3f3f3"
        stroke="#1e3a5f"
        strokeWidth={strokeWidth}
      />

      {/* Inner separator ring */}
      <circle
        cx={cx} cy={cy} r={innerR}
        fill="none"
        stroke="#1e3a5f"
        strokeWidth={innerStroke}
        opacity="0.45"
      />

      {/* Ring text — "GLOBAL ONLINE YOGA ASSOCIATION" */}
      <text
        fontSize={ringFontSize}
        fill="#1e3a5f"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontWeight="700"
        letterSpacing={ringLetterSpace}
      >
        <textPath href={`#${safeId}`} startOffset="3%">
          GLOBAL ONLINE YOGA ASSOCIATION
        </textPath>
      </text>

      {/* Acronym */}
      <text
        x={cx}
        y={startY}
        textAnchor="middle"
        fontSize={acronymFontSize}
        fontWeight="900"
        fill="#8b1a1a"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
      >
        {acronym}
      </text>

      {/* Sub-lines */}
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={startY + (i + 1) * lineHeight}
          textAnchor="middle"
          fontSize={subFontSize}
          fontWeight="600"
          fill="#1e3a5f"
          fontFamily="'Helvetica Neue', Arial, sans-serif"
        >
          {line}
        </text>
      ))}
    </svg>
  );
}
