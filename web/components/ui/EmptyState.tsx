'use client';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {/* Icon with float animation */}
      <div className="mb-4 text-[40px] animate-float">{icon}</div>

      {/* Title */}
      <h3 className="mb-2 font-orbitron text-xs tracking-[2px] uppercase text-white/40">
        {title}
      </h3>

      {/* Message */}
      <p className="mb-4 max-w-[300px] font-rajdhani text-sm text-white/40">{message}</p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-md border border-white/10 bg-white/5 px-4 py-2 font-orbitron text-xs tracking-wider text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
