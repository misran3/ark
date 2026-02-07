'use client';

interface SkeletonProps {
  variant?: 'text' | 'heading' | 'metric' | 'bar' | 'card' | 'circle' | 'custom';
  width?: string;
  height?: string;
  lines?: number;
  className?: string;
}

const shimmerStyle = {
  background: 'linear-gradient(90deg, rgba(139,92,246,0.03) 0%, rgba(99,102,241,0.08) 30%, rgba(59,130,246,0.03) 60%, rgba(139,92,246,0.03) 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 2s ease-in-out infinite',
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines,
  className = '',
}: SkeletonProps) {
  // Determine dimensions based on variant
  let finalWidth = width;
  let finalHeight = height;

  if (!finalWidth || !finalHeight) {
    switch (variant) {
      case 'text':
        finalWidth = finalWidth || '100%';
        finalHeight = finalHeight || '12px';
        break;
      case 'heading':
        finalWidth = finalWidth || '60%';
        finalHeight = finalHeight || '20px';
        break;
      case 'metric':
        finalWidth = finalWidth || '120px';
        finalHeight = finalHeight || '40px';
        break;
      case 'bar':
        finalWidth = finalWidth || '100%';
        finalHeight = finalHeight || '6px';
        break;
      case 'card':
        finalWidth = finalWidth || '100%';
        finalHeight = finalHeight || '80px';
        break;
      case 'circle':
        finalWidth = finalWidth || '32px';
        finalHeight = finalHeight || '32px';
        break;
      case 'custom':
        finalWidth = finalWidth || '100%';
        finalHeight = finalHeight || '16px';
        break;
      default:
        finalWidth = finalWidth || '100%';
        finalHeight = finalHeight || '12px';
    }
  }

  // Handle multiple lines for 'text' variant
  if (variant === 'text' && lines && lines > 1) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => {
          const isLastLine = index === lines - 1;
          const lineWidth = isLastLine ? '60%' : '100%';

          return (
            <div
              key={index}
              style={{
                width: lineWidth,
                height: finalHeight,
                borderRadius: '4px',
                ...shimmerStyle,
              }}
            />
          );
        })}
      </div>
    );
  }

  // Handle circle variant with border-radius
  if (variant === 'circle') {
    return (
      <div
        style={{
          width: finalWidth,
          height: finalHeight,
          borderRadius: '50%',
          ...shimmerStyle,
        }}
        className={className}
      />
    );
  }

  // Default single skeleton bar
  return (
    <div
      style={{
        width: finalWidth,
        height: finalHeight,
        borderRadius: '4px',
        ...shimmerStyle,
      }}
      className={className}
    />
  );
}

export default Skeleton;
