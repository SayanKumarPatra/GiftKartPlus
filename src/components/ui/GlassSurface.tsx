import React from 'react';

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'subtle';
  padded?: boolean;
}

export function GlassSurface({
  variant = 'default',
  padded = true,
  className = '',
  children,
  ...rest
}: GlassSurfaceProps) {
  const surfaceClass =
    variant === 'strong'
      ? 'glass-surface-strong'
      : variant === 'subtle'
        ? 'glass-subtle'
        : 'glass-surface';

  return (
    <div
      className={`${surfaceClass} rounded-2xl ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
