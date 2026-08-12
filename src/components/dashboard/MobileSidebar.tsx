// src/components/dashboard/MobileSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { cn } from '@/src/lib/utils';

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResize);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button - visible on mobile/tablet */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
        aria-label="Open sidebar navigation"
        aria-expanded={isOpen}
      >
        <Menu size={24} />
      </button>

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-all duration-300',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={cn(
            'absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

        {/* Panel */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-[280px] bg-slate-950 shadow-2xl transition-transform duration-300 ease-out transform',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="relative h-full">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-slate-700"
              aria-label="Close sidebar navigation"
            >
              <X size={18} />
            </button>

            {/* Mobile Sidebar Content */}
            <Sidebar isMobile={true} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      </div>
    </>
  );
}