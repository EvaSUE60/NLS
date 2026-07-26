// src/components/dashboard/SidebarItem.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  isCollapsed?: boolean;
}

export function SidebarItem({ href, icon: Icon, label, active, isCollapsed }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = active ?? pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
        isActive
          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
          : 'text-sky-100 hover:bg-sky-800 hover:text-white'
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon 
        size={20} 
        className={cn(
          'flex-shrink-0',
          isActive ? 'text-white' : 'text-sky-300 group-hover:text-white'
        )} 
      />
      {!isCollapsed && <span>{label}</span>}
      {isCollapsed && <span className="sr-only">{label}</span>}
    </Link>
  );
}