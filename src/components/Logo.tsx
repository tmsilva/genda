import React from 'react';

interface LogoProps {
  variant?: 'icon' | 'full' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  lightMode?: boolean;
}

export default function Logo({
  variant = 'full',
  size = 'md',
  className = '',
  lightMode = false,
}: LogoProps) {
  // Use Logo.png for light theme, Logo-white.png for dark theme
  const logoSrc = lightMode ? '/Logo.png' : '/Logo-white.png';

  const sizeClasses = {
    sm: variant === 'icon' ? 'h-7 w-7' : variant === 'compact' ? 'h-7' : 'h-9',
    md: variant === 'icon' ? 'h-9 w-9' : variant === 'compact' ? 'h-9' : 'h-12',
    lg: variant === 'icon' ? 'h-12 w-12' : variant === 'compact' ? 'h-11' : 'h-16',
    xl: variant === 'icon' ? 'h-16 w-16' : variant === 'compact' ? 'h-14' : 'h-24',
  };

  return (
    <div className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}>
      <img
        src={logoSrc}
        alt="Genda"
        className={`${sizeClasses[size]} max-w-full object-contain transition-opacity duration-300`}
      />
    </div>
  );
}

