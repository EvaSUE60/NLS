// src/components/dashboard/MobileSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on Escape key press or screen resize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
        aria-label="Open sidebar navigation"
        aria-expanded={isOpen}
      >
        <Menu size={24} />
      </button>

      {/* Drawer & Backdrop Overlay */}
      {isOpen && (
        <div className="relative z-50 md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sliding Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 shadow-2xl animate-in slide-in-from-left duration-250 ease-out">
            <div className="relative h-full">
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-slate-700"
                aria-label="Close sidebar navigation"
              >
                <X size={18} />
              </button>

              {/* Sidebar Content */}
              <Sidebar />
            </div>
          </div>
        </div>
      )}
    </>
  );
}