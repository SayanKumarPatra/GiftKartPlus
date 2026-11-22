import React from 'react';

type ButtonVariant = 'primary' | 'accent' | 'glass' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#6A11CB] text-white hover:bg-[#540CA6] shadow-sm shadow-[#6A11CB]/20 focus-visible:ring-[#6A11CB]',
    accent:
      'bg-[#FF4D8D] text-white hover:bg-[#E03574] shadow-sm shadow-[#FF4D8D]/20 focus-visible:ring-[#FF4D8D]',
    glass:
      'bg-white/80 text-[#1A1025] border border-[#EBD8FF] hover:bg-[#F7F0FF] hover:border-[#6A11CB]/40 focus-visible:ring-[#6A11CB]',
    ghost:
      'bg-transparent text-[#594A6B] hover:bg-[#EBD8FF]/45 hover:text-[#1A1025] focus-visible:ring-[#6A11CB]',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'min-h-[38px] px-3.5 py-1.5 text-xs',
    md: 'min-h-[42px] px-5 py-2.5 text-sm',
    lg: 'min-h-[46px] px-6 py-3 text-sm',
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
