import { ReactNode } from 'react';
import BottomTabBar from './BottomTabBar';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-warm-cream flex flex-col max-w-lg mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#3D2B3E]/70 backdrop-blur-xl border border-pink/8 dark:border-white/[0.06] shadow-[0_1px_3px_rgba(255,105,180,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] mx-4 mt-3 px-4 py-3 rounded-2xl flex items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎀</span>
          <h1 className="font-display text-base font-bold text-gradient-warm">
            {title || 'UsTime'}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pt-4 pb-20">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
}
