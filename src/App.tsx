import { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppStateProvider, useSharedAppState } from './hooks/AppStateContext';
import { ToastProvider } from './components/ui/Toast';
import { isSupabaseConfigured } from './lib/supabase';
import { fetchCoupleSettings, verifyPasscode } from './lib/db';
import { LOCAL_KEYS } from './lib/constants';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import SupabaseSetup from './components/onboarding/SupabaseSetup';
import PasscodeScreen from './components/onboarding/PasscodeScreen';
import SetupWizard from './components/onboarding/SetupWizard';

const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PhotoWallPage = lazy(() => import('./pages/PhotoWallPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const LettersPage = lazy(() => import('./pages/LettersPage'));
const OnThisDayPage = lazy(() => import('./pages/OnThisDayPage'));

/**
 * Simple state machine. Only ONE phase is active at a time.
 */
type Phase =
  | 'config-supabase'      // Enter Supabase URL + key
  | 'checking-first-time'  // Check if couple data exists
  | 'first-time-passcode'  // Set up passcode (first time)
  | 'first-time-info'      // Enter couple info (first time)
  | 'returning-passcode'   // Enter passcode (returning)
  | 'loading-data'         // Load data after unlock
  | 'main-app'             // Main app
  ;

function AppRoutes() {
  const { state, loading, unlock, setCoupleInfo, getRememberedAuth } = useSharedAppState();
  const [phase, setPhase] = useState<Phase>(
    isSupabaseConfigured() ? 'checking-first-time' : 'config-supabase'
  );
  const [pendingPasscode, setPendingPasscode] = useState('');
  const [pendingIdentity, setPendingIdentity] = useState<'me' | 'partner'>('me');
  const [returningAvatars, setReturningAvatars] = useState<{
    avatarMe?: string;
    avatarPartner?: string;
    myName?: string;
    partnerName?: string;
  }>({});

  // When Supabase is configured, check if it's first time
  useEffect(() => {
    if (phase !== 'checking-first-time') return;
    fetchCoupleSettings().then(async (settings) => {
      if (!settings) {
        // No settings in DB — first time
        setPhase('first-time-passcode');
      } else {
        setReturningAvatars({
          avatarMe: settings.coupleInfo.avatarMe,
          avatarPartner: settings.coupleInfo.avatarPartner,
          myName: settings.coupleInfo.myName,
          partnerName: settings.coupleInfo.partnerName,
        });

        // Try auto-login with remembered passcode
        const remembered = getRememberedAuth();
        if (remembered) {
          const valid = await verifyPasscode(remembered.passcode);
          if (valid) {
            // Auto-login success — skip passcode screen
            unlock(remembered.ident, remembered.passcode);
            setPhase('loading-data');
            return;
          }
          // Passcode invalid (changed from another device) — clear it
          localStorage.removeItem(LOCAL_KEYS.remembered);
        }

        setPhase('returning-passcode');
      }
    });
  }, [phase]);

  // Apply theme
  useEffect(() => {
    const isDark =
      state.theme === 'dark' ||
      (state.theme === 'auto' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('dark', isDark);
  }, [state.theme]);

  // Wait for data to actually load before showing main app
  useEffect(() => {
    if (phase === 'loading-data' && !loading) {
      setPhase('main-app');
    }
  }, [phase, loading]);

  // ====== Phase: Supabase config ======
  if (phase === 'config-supabase') {
    return (
      <AppLayout title="连接数据库">
        <SupabaseSetup
          onComplete={() => setPhase('checking-first-time')}
        />
      </AppLayout>
    );
  }

  // ====== Phase: First-time passcode ======
  if (phase === 'first-time-passcode') {
    return (
      <AppLayout title="设置密码">
        <PasscodeScreen
          isFirstTime={true}
          onUnlock={(identity, passcode) => {
            setPendingPasscode(passcode || '');
            setPendingIdentity(identity);
            setPhase('first-time-info');
          }}
          onNewSetup={() => setPhase('config-supabase')}
        />
      </AppLayout>
    );
  }

  // ====== Phase: First-time couple info ======
  if (phase === 'first-time-info') {
    return (
      <AppLayout title="欢迎来到 UsTime">
        <SetupWizard
          onComplete={async (coupleInfo) => {
            await setCoupleInfo(coupleInfo, pendingPasscode);
            unlock(pendingIdentity, pendingPasscode);
            setPhase('loading-data');
          }}
        />
      </AppLayout>
    );
  }

  // ====== Phase: Returning passcode ======
  if (phase === 'returning-passcode') {
    return (
      <AppLayout title="UsTime">
        <PasscodeScreen
          isFirstTime={false}
          onUnlock={(identity, passcode) => {
            unlock(identity, passcode);
            setPhase('loading-data');
          }}
          onNewSetup={() => setPhase('first-time-passcode')}
          avatarMe={returningAvatars.avatarMe}
          avatarPartner={returningAvatars.avatarPartner}
          myName={returningAvatars.myName}
          partnerName={returningAvatars.partnerName}
        />
      </AppLayout>
    );
  }

  // ====== Phase: Loading data ======
  if (phase === 'loading-data' || phase === 'checking-first-time') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <span className="text-4xl animate-bounce">💕</span>
            <p className="text-text-muted text-sm">
              {phase === 'loading-data' ? '加载数据中...' : '连接中...'}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ====== Phase: Main app ======
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout showTabBar>
              <HomePage />
            </AppLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <AppLayout title="设置" showTabBar>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="text-3xl animate-bounce">💕</span>
                  </div>
                }
              >
                <SettingsPage />
              </Suspense>
            </AppLayout>
          }
        />
        <Route
          path="/photos"
          element={
            <AppLayout title="照片墙" showTabBar>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="text-3xl animate-bounce">🖼️</span>
                  </div>
                }
              >
                <PhotoWallPage />
              </Suspense>
            </AppLayout>
          }
        />
        <Route
          path="/explore"
          element={
            <AppLayout title="发现" showTabBar>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="text-3xl animate-bounce">🗺️</span>
                  </div>
                }
              >
                <ExplorePage />
              </Suspense>
            </AppLayout>
          }
        />
        <Route
          path="/letters"
          element={
            <AppLayout title="书信" showTabBar>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="text-3xl animate-bounce">✉️</span>
                  </div>
                }
              >
                <LettersPage />
              </Suspense>
            </AppLayout>
          }
        />
        <Route
          path="/onthisday"
          element={
            <AppLayout title="那年今日" showTabBar>
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <span className="text-3xl animate-bounce">📅</span>
                  </div>
                }
              >
                <OnThisDayPage />
              </Suspense>
            </AppLayout>
          }
        />
        <Route
          path="*"
          element={
            <AppLayout title="UsTime" showTabBar>
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <span className="text-5xl mb-4">🔍</span>
                <h2 className="font-display text-xl font-bold text-text-primary mb-2">
                  页面不存在
                </h2>
                <p className="text-text-muted text-sm">
                  你来到了一个不存在的地方
                </p>
              </div>
            </AppLayout>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AppStateProvider>
          <AppRoutes />
        </AppStateProvider>
      </ToastProvider>
    </HashRouter>
  );
}
