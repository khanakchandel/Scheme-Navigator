import React from 'react';
import { Link } from 'react-router-dom';

interface CompassLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  isAnimated?: boolean;
}

export const CompassLogo: React.FC<CompassLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  isAnimated = false,
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12',
  };

  const textStyles = {
    sm: 'text-[14.5px] sm:text-base lg:text-lg',
    md: 'text-base sm:text-lg sm:text-xl',
    lg: 'text-2xl',
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2 sm:gap-2.5 group ${className}`}>
      {/* Compass Icon Emblem */}
      <div className={`relative ${iconDimensions[size]} rounded-2xl bg-gradient-to-br from-teal-800 via-teal-900 to-slate-950 p-2 shadow-lg shadow-teal-950/20 border border-teal-500/40 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-400/60 group-hover:shadow-emerald-900/30`}>
        {/* Ambient Ring Glow */}
        <div className="absolute inset-0 rounded-2xl bg-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xs" />
        
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-full h-full text-teal-100 relative z-10 ${isAnimated ? 'animate-spin-slow' : 'group-hover:rotate-45 transition-transform duration-700 ease-out'}`}
        >
          <circle cx="12" cy="12" r="9.5" className="stroke-teal-400/40" />
          <line x1="12" y1="2.5" x2="12" y2="5" className="stroke-emerald-300" strokeWidth="2" />
          <line x1="12" y1="19" x2="12" y2="21.5" className="stroke-teal-400/60" />
          <line x1="2.5" y1="12" x2="5" y2="12" className="stroke-teal-400/60" />
          <line x1="19" y1="12" x2="21.5" y2="12" className="stroke-teal-400/60" />
          {/* Compass Needle */}
          <polygon
            points="16.24 7.76 13.5 13.5 7.76 16.24 10.5 10.5 16.24 7.76"
            className="fill-emerald-400 stroke-emerald-300"
            strokeWidth="1.2"
          />
          <circle cx="12" cy="12" r="1.5" className="fill-white" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 dark:text-white ${textStyles[size]}`}>
              Scheme<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">Navigator</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 rounded-md border border-emerald-300/80 dark:border-emerald-800 shadow-3xs tracking-wider">
              IN
            </span>
          </div>
          {size !== 'sm' && (
            <span className="text-[10.5px] font-semibold text-slate-500 tracking-wide -mt-0.5 hidden md:block">
              Simplified Citizen Guidance
            </span>
          )}
        </div>
      )}
    </Link>
  );
};
