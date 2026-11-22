import React from 'react';
import { GlassSurface } from './GlassSurface';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <GlassSurface className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBD8FF]/60 text-[#6A11CB]">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-[#1A1025]">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[#594A6B]">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </GlassSurface>
  );
}
