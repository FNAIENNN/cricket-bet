'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Calendar, Wallet, User, Trophy } from 'lucide-react';

const navItems = [
  { href: '/matches', icon: Calendar, label: 'Matches' },
  { href: '/bets', icon: Trophy, label: 'Bets' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 z-50 lg:hidden">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-lg border-b border-gray-800 lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/matches" className="flex items-center gap-2">
            <span className="text-2xl">🏏</span>
            <span className="font-bold text-emerald-500">CricketBet</span>
          </Link>
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-64 bg-gray-900 shadow-xl z-50 lg:hidden animate-slide-in">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <span className="font-bold text-white">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
