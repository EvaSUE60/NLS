// src/components/ui/Avatar.tsx
import { cn } from '@/src/lib/utils';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}