interface CoinIconProps {
  size?: number;
  className?: string;
}

export function CoinIcon({ size = 24, className = "" }: CoinIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="11" fill="url(#coinGrad)" stroke="#B8860B" strokeWidth="0.5" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="#DAA520" strokeWidth="0.5" opacity="0.6" />
      {/* Inner glow ring */}
      <circle cx="12" cy="12" r="7.5" fill="url(#innerGrad)" opacity="0.3" />
      {/* Star burst / L emblem */}
      <path
        d="M12 4.5L13.2 9H17.9L14.3 11.7L15.5 16.2L12 13.5L8.5 16.2L9.7 11.7L6.1 9H10.8L12 4.5Z"
        fill="#DAA520"
        stroke="#B8860B"
        strokeWidth="0.3"
      />
      <path
        d="M12 6.5L12.9 9.8H16.4L13.7 11.7L14.6 15L12 13.1L9.4 15L10.3 11.7L7.6 9.8H11.1L12 6.5Z"
        fill="#FFD700"
      />
      <defs>
        <radialGradient id="coinGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#DAA520" />
          <stop offset="100%" stopColor="#8B6914" />
        </radialGradient>
        <radialGradient id="innerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
