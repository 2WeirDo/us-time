import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  hint: string;
  action?: ReactNode;
}

/** Reusable empty state placeholder for lists and grids. */
export default function EmptyState({ icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="font-display text-base font-semibold text-text-primary mb-1">
        {title}
      </h3>
      <p className="text-sm text-text-muted mb-4">{hint}</p>
      {action}
    </div>
  );
}
