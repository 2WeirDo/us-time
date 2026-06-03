import { motion } from 'framer-motion';
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
    <nav className="fixed bottom-3 inset-x-0 z-40 max-w-lg mx-auto px-4">
      <div className="bg-white/55 dark:bg-[#3D2B3E]/50 backdrop-blur-2xl border border-pink/8 dark:border-white/[0.04] rounded-[24px] shadow-[0_4px_28px_rgba(255,105,180,0.07),0_0_0_1px_rgba(255,105,180,0.03)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex items-center justify-around px-1 py-1.5 safe-bottom">
          {TABS.map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-2xl transition-all min-w-[52px] group"
              >
                {/* Active pill background */}
                {active && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-pink/8 dark:bg-pink/[0.12] rounded-2xl border border-pink/12 dark:border-pink/[0.15]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="relative z-10">
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.3 : 1.8}
                    className={`transition-all duration-300 ${
                      active
                        ? 'text-pink dark:text-pink'
                        : 'text-text-muted/70 dark:text-text-muted/65 group-hover:text-text-muted/90 dark:group-hover:text-text-muted/65'
                    }`}
                  />
                </div>
                <span
                  className={`relative z-10 text-[10px] transition-all duration-300 ${
                    active
                      ? 'text-pink dark:text-pink font-semibold'
                      : 'text-text-muted/100 dark:text-text-muted/95 font-medium'
                  }`}
                >
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
