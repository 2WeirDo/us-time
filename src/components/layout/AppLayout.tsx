import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Home } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen min-h-[100dvh] bg-warm-cream flex flex-col max-w-lg mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/50 mx-6 px-4 py-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎀</span>
          <h1 className="font-display text-lg font-bold text-gradient-warm">
            {title || 'UsTime'}
          </h1>
        </div>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => navigate('/')}
            className={`p-2 rounded-xl transition-all duration-200 ${
              location.pathname === '/'
                ? 'bg-pink/10 text-pink'
                : 'text-text-muted hover:text-text-primary hover:bg-white/50'
            }`}
            aria-label="首页"
          >
            <Home size={20} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className={`p-2 rounded-xl transition-all duration-200 ${
              location.pathname === '/settings'
                ? 'bg-pink/10 text-pink'
                : 'text-text-muted hover:text-text-primary hover:bg-white/50'
            }`}
            aria-label="设置"
          >
            <Settings size={20} />
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pt-4">
        {children}
        {/* Bottom fade */}
        <div className="sticky bottom-0 h-6 bottom-fade pointer-events-none -mx-6" />
      </main>
    </div>
  );
}
