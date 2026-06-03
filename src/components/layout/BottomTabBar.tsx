import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Images, Compass, PenLine, Settings } from 'lucide-react';

interface Tab {
  path: string;
  icon: typeof Home;
  label: string;
}

const TABS: Tab[] = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/photos', icon: Images, label: '照片' },
  { path: '/explore', icon: Compass, label: '发现' },
  { path: '/letters', icon: PenLine, label: '书信' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 max-w-lg mx-auto">
      <div className="glass border-t border-pink/8 rounded-t-2xl">
        <div className="flex items-center justify-around px-2 py-1 safe-bottom">
          {TABS.map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-[56px] ${
                  active
                    ? 'text-pink'
                    : 'text-text-muted/50 hover:text-text-muted'
                }`}
              >
                <div className={`relative p-0.5 rounded-full transition-all ${
                  active ? 'bg-pink/10' : ''
                }`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium transition-all ${
                  active ? 'font-semibold' : ''
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
