import React from 'react';

interface LogoProps {
  variant?: 'icon' | 'full' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  lightMode?: boolean;
}

export default function Logo({ variant = 'full', size = 'md', className = '', lightMode = false }: LogoProps) {
  // Size mapping for standard horizontal logo (compact or icon)
  const sizeClasses = {
    sm: variant === 'icon' ? 'w-8 h-8' : 'h-8',
    md: variant === 'icon' ? 'w-12 h-12' : 'h-12',
    lg: variant === 'icon' ? 'w-16 h-16' : 'h-16',
    xl: variant === 'icon' ? 'w-24 h-24' : 'h-24',
  };

  // SVG dimensions
  const svgMarkup = (isFull: boolean) => (
    <svg
      viewBox="0 0 220 220"
      className={`${isFull ? {
        sm: 'h-6 w-6',
        md: 'h-10 w-10',
        lg: 'h-12 w-12 sm:h-14 sm:w-14',
        xl: 'h-16 w-16 sm:h-20 sm:w-20',
      }[size] : (variant === 'icon' ? 'w-full h-full' : 'w-auto h-full shrink-0')} overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Genda Rich Purple/Indigo Brand Gradient */}
        <linearGradient id="genda-brand-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f46e5" />    {/* Indigo */}
          <stop offset="50%" stopColor="#8b5cf6" />   {/* Violet */}
          <stop offset="100%" stopColor="#a855f7" />  {/* Purple */}
        </linearGradient>

        {/* Pointer/Clock Hand Gradient */}
        <linearGradient id="genda-pointer-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>

        {/* Premium Ambient Glow for the G element */}
        <filter id="genda-glow-effect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer G Curve & Crossbar (Center: 110, 110. Radius: 62) */}
      <path
        d="M 158 72 
           A 62 62 0 1 0 158 148
           L 158 112
           L 112 112"
        stroke="url(#genda-brand-grad)"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#genda-glow-effect)"
      />

      {/* Central Pivot Circle */}
      <circle 
        cx="112" 
        cy="112" 
        r="11" 
        fill="url(#genda-pointer-grad)" 
      />
      <circle 
        cx="112" 
        cy="112" 
        r="4.5" 
        fill="#ffffff" 
      />

      {/* Tapered Clock Pointer Hand pointing towards (158, 72) */}
      <line 
        x1="112" 
        y1="112" 
        x2="150" 
        y2="79" 
        stroke="url(#genda-pointer-grad)" 
        strokeWidth="8.5" 
        strokeLinecap="round" 
      />

      {/* Sharp Clock Needle Arrowtip */}
      <polygon 
        points="162,68 140,77 150,89" 
        fill="url(#genda-pointer-grad)" 
      />
    </svg>
  );

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        {/* Primeira linha: Símbolo e Genda escrito, centralizada */}
        <div className="flex items-center justify-center gap-2.5">
          {svgMarkup(true)}
          <span 
            
            style={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 200,
              color: lightMode ? '#0f172a' : '#ffffff',
              letterSpacing: '-0.04em',
            }}
            className={`font-display tracking-tight leading-none font-extralight ${
              size === 'sm' ? 'text-[1.4rem]' : 
              size === 'lg' ? 'text-[2rem] sm:text-[2.4rem]' : 
              size === 'xl' ? 'text-[2.6rem] sm:text-[3.4rem]' : 
              'text-[1.9rem]'
            }`}
          >
            Genda
          </span>
        </div>

        {/* Segunda linha: Slogan */}
        <div 
          className="font-sans font-bold tracking-[0.2em] uppercase leading-tight mt-2.5 w-full text-center"
          style={{
            fontSize: size === 'sm' ? '5.5px' : size === 'lg' ? '8px' : size === 'xl' ? '10px' : '7.2px',
            color: lightMode ? '#64748b' : '#94a3b8',
          }}
        >
          SUA AGENDA. SEU TEMPO. SEU NEGÓCIO.
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${sizeClasses[size]} ${className}`}>
      {svgMarkup(false)}

      {/* Genda Wordmark */}
      {variant !== 'icon' && (
        <div className="flex flex-col justify-center items-start text-left h-full">
          {/* Geometric Custom Sans Wordmark */}
          <span 
            
            style={{
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 200,
              color: lightMode ? '#0f172a' : '#ffffff',
              letterSpacing: '-0.04em',
            }}
            className={`font-display tracking-tight leading-none font-extralight ${
              size === 'sm' ? 'text-[1.4rem]' : 
              size === 'lg' ? 'text-[2rem] sm:text-[2.4rem]' : 
              size === 'xl' ? 'text-[2.6rem] sm:text-[3.4rem]' : 
              'text-[1.9rem]'
            }`}
          >
            Genda
          </span>
        </div>
      )}
    </div>
  );
}
