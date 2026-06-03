import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { verifyPasscode } from '../../lib/db';

interface PasscodeScreenProps {
  isFirstTime: boolean;
  onUnlock: (identity: 'me' | 'partner', passcode?: string) => void;
  onNewSetup: () => void;
  avatarMe?: string;
  avatarPartner?: string;
  myName?: string;
  partnerName?: string;
}

export default function PasscodeScreen({
  isFirstTime,
  onUnlock,
  onNewSetup,
  avatarMe,
  avatarPartner,
  myName,
  partnerName,
}: PasscodeScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [identity, setIdentity] = useState<'me' | 'partner' | null>(null);
  const [error, setError] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const resetState = useCallback(() => {
    setPasscode('');
    setConfirmPasscode('');
    setError('');
    setIdentity(null);
    setStep('enter');
  }, []);

  useEffect(() => {
    resetState();
  }, [isFirstTime, resetState]);

  const handleDigit = (digit: string) => {
    const current = step === 'confirm' ? confirmPasscode : passcode;
    if (current.length < 4) {
      if (step === 'confirm') {
        setConfirmPasscode(current + digit);
      } else {
        const newCode = passcode + digit;
        setPasscode(newCode);
        setError('');
      }
    }
  };

  const handleDelete = () => {
    if (step === 'confirm') {
      setConfirmPasscode((prev) => prev.slice(0, -1));
    } else {
      setPasscode((prev) => prev.slice(0, -1));
    }
    setError('');
  };

  // For returning users: verify passcode + identity → unlock
  const handleReturningVerify = useCallback(async () => {
    if (passcode.length !== 4 || !identity) return;
    setError('');

    const valid = await verifyPasscode(passcode);
    if (valid) {
      onUnlock(identity, passcode);
    } else {
      setError('密码不正确');
      setPasscode('');
    }
  }, [passcode, identity, onUnlock]);

  // For first-time: enter passcode → confirm → choose identity → unlock
  const handleFirstTimeConfirm = useCallback(() => {
    if (passcode.length === 4 && step === 'enter') {
      setStep('confirm');
    }
  }, [passcode, step]);

  // When confirm passcode is 4 digits, check match
  useEffect(() => {
    if (isFirstTime && confirmPasscode.length === 4) {
      if (confirmPasscode === passcode) {
        // Passcode confirmed, now pick identity
      } else {
        setError('两次密码不一致，请重新输入');
        setConfirmPasscode('');
        // Stay on confirm step, just clear the confirm field
      }
    }
  }, [confirmPasscode, passcode, isFirstTime]);

  // For first-time: when passcode confirmed and identity chosen → unlock
  const handleFirstTimeFinish = useCallback(() => {
    if (confirmPasscode === passcode && identity && isFirstTime) {
      onUnlock(identity, passcode);
    }
  }, [confirmPasscode, passcode, identity, isFirstTime, onUnlock]);

  // Auto-trigger returning verify
  useEffect(() => {
    if (!isFirstTime && passcode.length === 4 && identity) {
      handleReturningVerify();
    }
  }, [passcode, identity, isFirstTime, handleReturningVerify]);

  // Auto-trigger first-time flow
  useEffect(() => {
    if (isFirstTime && step === 'enter' && passcode.length === 4) {
      // Slight delay so user sees the 4th dot
      const timer = setTimeout(() => handleFirstTimeConfirm(), 300);
      return () => clearTimeout(timer);
    }
  }, [passcode, step, isFirstTime, handleFirstTimeConfirm]);

  const displayPasscode = step === 'confirm' ? confirmPasscode : passcode;
  const showIdentitySelector = isFirstTime ? confirmPasscode === passcode && passcode.length === 4 : true;

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[80vh] px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        className="text-5xl block mb-6"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🔐
      </motion.span>

      {isFirstTime ? (
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
            {step === 'enter' ? '设置你们的密码' : '确认密码'}
          </h2>
          <p className="text-text-muted text-sm">
            {step === 'enter'
              ? '设置一个只有你们知道的 4 位数字密码'
              : '请再次输入相同的密码'}
          </p>
        </div>
      ) : (
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
            输入密码
          </h2>
          <p className="text-text-muted text-sm">
            这是属于你们的私密空间
          </p>
        </div>
      )}

      {/* Identity selector */}
      {showIdentitySelector && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIdentity('me')}
            className={`flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
              identity === 'me'
                ? 'bg-pink/10 ring-2 ring-pink/30 text-pink'
                : 'bg-warm-cream text-text-muted hover:text-text-primary'
            }`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-warm-cream flex items-center justify-center">
              {avatarMe ? (
                <img src={avatarMe} alt={myName || '我'} className="w-full h-full object-cover" />
              ) : (
                <User size={24} />
              )}
            </div>
            <span className="text-sm font-medium">{myName || '我'}</span>
          </button>
          <button
            onClick={() => setIdentity('partner')}
            className={`flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
              identity === 'partner'
                ? 'bg-pink/10 ring-2 ring-pink/30 text-pink'
                : 'bg-warm-cream text-text-muted hover:text-text-primary'
            }`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-warm-cream flex items-center justify-center">
              {avatarPartner ? (
                <img src={avatarPartner} alt={partnerName || 'TA'} className="w-full h-full object-cover" />
              ) : (
                <User size={24} />
              )}
            </div>
            <span className="text-sm font-medium">{partnerName || 'TA'}</span>
          </button>
        </div>
      )}

      {showIdentitySelector && !identity && (
        <p className="text-text-muted/50 text-xs mb-4">先选择你的身份</p>
      )}

      {/* Passcode dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < displayPasscode.length
                ? 'bg-pink border-pink'
                : 'border-text-muted/20'
            }`}
            animate={i < displayPasscode.length ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>

      {error && (
        <motion.p
          className="text-pink text-sm mb-4"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(
          (digit) => (
            <button
              key={digit}
              onClick={() => {
                if (digit === '⌫') handleDelete();
                else if (digit) handleDigit(digit);
              }}
              disabled={!digit}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-semibold transition-all active:scale-90 ${
                digit
                  ? 'bg-white shadow-soft hover:shadow-card text-text-primary'
                  : 'invisible'
              }`}
            >
              {digit === '⌫' ? '←' : digit}
            </button>
          )
        )}
      </div>

      {/* First-time: start button after identity + passcode confirmed */}
      {isFirstTime && confirmPasscode === passcode && passcode.length === 4 && identity && (
        <motion.button
          className="mt-8 btn-primary flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleFirstTimeFinish}
        >
          开始设置
        </motion.button>
      )}

      {/* New setup link (only when returning) */}
      {!isFirstTime && (
        <button
          onClick={onNewSetup}
          className="mt-8 text-xs text-text-muted/50 hover:text-text-muted transition-colors"
        >
          重新设置？点这里
        </button>
      )}
    </motion.div>
  );
}
