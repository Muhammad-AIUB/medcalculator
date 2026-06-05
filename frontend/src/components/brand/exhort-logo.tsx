interface ExhortLogoProps {
  className?: string;
}

/**
 * "Developed by EXHORT — Do Better" brand mark.
 * Recreated as crisp text + a 4-colour X glyph so it scales sharply.
 * Swap in the official PNG later if needed.
 */
export function ExhortLogo({ className }: ExhortLogoProps) {
  return (
    <div className={`flex flex-col items-end leading-none select-none ${className ?? ''}`}>
      <span className="text-[9px] font-medium tracking-wide text-gray-400">
        Developed by
      </span>

      <div className="flex items-center mt-0.5">
        <span className="text-[28px] font-extrabold tracking-tight text-gray-800">E</span>

        {/* 4-colour X */}
        <svg viewBox="0 0 32 32" className="h-6 w-6 -mx-[3px]" aria-hidden="true">
          {/* top-left → centre (blue) */}
          <line x1="5" y1="5" x2="16" y2="16" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
          {/* centre → bottom-right (green) */}
          <line x1="16" y1="16" x2="27" y2="27" stroke="#16A34A" strokeWidth="5" strokeLinecap="round" />
          {/* top-right → centre (red) */}
          <line x1="27" y1="5" x2="16" y2="16" stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
          {/* centre → bottom-left (yellow) */}
          <line x1="16" y1="16" x2="5" y2="27" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" />
        </svg>

        <span className="text-[28px] font-extrabold tracking-tight text-gray-800">HORT</span>
      </div>

      <span className="text-[9px] font-medium tracking-wide text-gray-400 mr-1">
        Do Better
      </span>
    </div>
  );
}
