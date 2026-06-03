import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import type { CoupleInfo } from '../../types';
import AvatarUpload from '../ui/AvatarUpload';
import DatePicker from '../ui/DatePicker';

interface SetupWizardProps {
  onComplete: (info: CoupleInfo) => void;
}

const STEPS = [
  {
    title: '你们的名字',
    subtitle: '在这里留下你们的名字',
    icon: '💑',
  },
  {
    title: '在一起的日期',
    subtitle: '从这一天开始，每一天都值得记录',
    icon: '📅',
  },
  {
    title: '选一个代表你们的 Emoji',
    subtitle: '属于你们的专属符号',
    icon: '✨',
  },
];

const EMOJI_PAIRS = ['👫', '💑', '💕', '🐻‍❄️', '🦊🐰', '🌙⭐', '🐱🐶', '🌸🦋', '🍓🍰', '☀️🌙'];

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [myName, setMyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('👫');
  const [avatarMe, setAvatarMe] = useState('');
  const [avatarPartner, setAvatarPartner] = useState('');

  const canNext = () => {
    if (step === 0) return myName.trim() && partnerName.trim();
    if (step === 1) return startDate !== '';
    return true;
  };

  const handleNext = () => {
    if (step < 2) {
      setStep((s) => s + 1);
    }
  };

  const handleFinish = () => {
    const info: CoupleInfo = {
      myName: myName.trim(),
      partnerName: partnerName.trim(),
      startDate,
      coupleEmoji: selectedEmoji,
      avatarMe: avatarMe || undefined,
      avatarPartner: avatarPartner || undefined,
    };
    onComplete(info);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === step
                ? 'w-8 bg-pink'
                : i < step
                  ? 'w-4 bg-pink/40'
                  : 'w-4 bg-text-muted/20'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <motion.span
              className="text-6xl block mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {STEPS[step].icon}
            </motion.span>

            <h2 className="font-display text-2xl font-bold text-text-primary mb-1">
              {STEPS[step].title}
            </h2>
            <p className="text-text-muted text-sm mb-8">
              {STEPS[step].subtitle}
            </p>

            {/* Step 0: Names & Avatars */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2">
                  <AvatarUpload
                    image={avatarMe}
                    onChange={setAvatarMe}
                    size="lg"
                    label="你的头像"
                  />
                </div>
                <input
                  type="text"
                  value={myName}
                  onChange={(e) => setMyName(e.target.value)}
                  placeholder="你的名字"
                  className="input-field text-center text-lg"
                  autoFocus
                  maxLength={20}
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-text-muted/10" />
                  <Heart size={20} className="text-pink" />
                  <div className="flex-1 h-px bg-text-muted/10" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <AvatarUpload
                    image={avatarPartner}
                    onChange={setAvatarPartner}
                    size="lg"
                    label="TA 的头像"
                  />
                </div>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="TA 的名字"
                  className="input-field text-center text-lg"
                  maxLength={20}
                />
              </div>
            )}

            {/* Step 1: Date */}
            {step === 1 && (
              <div>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-text-muted/50 text-xs mt-4 text-center">
                  选择你们在一起的第一天 💕
                </p>
              </div>
            )}

            {/* Step 2: Emoji picker */}
            {step === 2 && (
              <div className="grid grid-cols-5 gap-3">
                {EMOJI_PAIRS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-3xl p-3 rounded-2xl transition-all duration-200 ${
                      selectedEmoji === emoji
                        ? 'bg-pink/10 ring-2 ring-pink/50 scale-110'
                        : 'hover:bg-white/60 active:scale-95'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Buttons */}
      <div className="mt-10 flex items-center gap-3">
        {step > 0 && (
          <button onClick={handleBack} className="btn-ghost flex items-center gap-1">
            <ArrowLeft size={18} />
            上一步
          </button>
        )}
        {step < 2 ? (
          <button
            onClick={handleNext}
            disabled={!canNext()}
            className={`btn-primary flex items-center gap-2 ${
              !canNext() ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            下一步
            <ArrowRight size={18} />
          </button>
        ) : (
          <motion.button
            onClick={handleFinish}
            className="btn-primary flex items-center gap-2 px-8"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles size={18} />
            开始我们的故事
          </motion.button>
        )}
      </div>
    </div>
  );
}
