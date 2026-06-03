import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Calendar,
  Download,
  Upload,
  Trash2,
  Plus,
  X,
  Moon,
  Sun,
  Loader2,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { useSharedAppState } from '../hooks/AppStateContext';
import AvatarUpload from '../components/ui/AvatarUpload';
import DatePicker from '../components/ui/DatePicker';
import type { Milestone } from '../types';
import { generatePairingCode, generatePairingQRCode } from '../lib/pairing';

export default function SettingsPage() {
  const {
    state,
    setCoupleInfo,
    addMilestone,
    deleteMilestone,
    setTheme,
    resetAll,
    exportData,
    importData,
  } = useSharedAppState();

  const coupleInfo = state.coupleInfo;

  const [editingInfo, setEditingInfo] = useState(false);
  const [myName, setMyName] = useState(coupleInfo?.myName || '');
  const [partnerName, setPartnerName] = useState(coupleInfo?.partnerName || '');
  const [startDate, setStartDate] = useState(coupleInfo?.startDate || '');
  const [coupleEmoji, setCoupleEmoji] = useState(coupleInfo?.coupleEmoji || '👫');
  const [avatarMe, setAvatarMe] = useState(coupleInfo?.avatarMe || '');
  const [avatarPartner, setAvatarPartner] = useState(coupleInfo?.avatarPartner || '');

  const [showNewMilestone, setShowNewMilestone] = useState(false);
  const [newMsTitle, setNewMsTitle] = useState('');
  const [newMsDate, setNewMsDate] = useState('');
  const [newMsIcon, setNewMsIcon] = useState('💝');

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingMsId, setDeletingMsId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingQR, setPairingQR] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSaveInfo = async () => {
    setSaving(true);
    await setCoupleInfo({
      myName: myName.trim(),
      partnerName: partnerName.trim(),
      startDate,
      coupleEmoji,
      avatarMe: avatarMe || undefined,
      avatarPartner: avatarPartner || undefined,
    });
    setSaving(false);
    setEditingInfo(false);
  };

  const handleAddMilestone = () => {
    if (!newMsTitle.trim() || !newMsDate) return;
    const milestone: Milestone = {
      id: crypto.randomUUID(),
      title: newMsTitle.trim(),
      date: newMsDate,
      type: 'custom',
      icon: newMsIcon,
    };
    addMilestone(milestone);
    setNewMsTitle('');
    setNewMsDate('');
    setNewMsIcon('💝');
    setShowNewMilestone(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const success = await importData(reader.result as string);
        setImportMessage(success ? '✅ 数据导入成功！' : '❌ 文件格式错误');
        setImporting(false);
        setTimeout(() => setImportMessage(''), 3000);
      };
      reader.onerror = () => setImporting(false);
      reader.readAsText(file);
    };
    input.click();
  };



  if (!coupleInfo) {
    return (
      <div className="card text-center py-12">
        <span className="text-4xl">💕</span>
        <p className="text-text-muted mt-4">请先完成初始设置</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Couple Info Section */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-pink" />
            <h3 className="font-display font-semibold text-text-primary">情侣信息</h3>
          </div>
          <button
            onClick={() => {
              if (editingInfo && !saving) handleSaveInfo();
              else if (!editingInfo) {
                setMyName(coupleInfo.myName);
                setPartnerName(coupleInfo.partnerName);
                setStartDate(coupleInfo.startDate);
                setCoupleEmoji(coupleInfo.coupleEmoji || '👫');
                setAvatarMe(coupleInfo.avatarMe || '');
                setAvatarPartner(coupleInfo.avatarPartner || '');
                setEditingInfo(true);
              }
            }}
            className="text-xs font-medium text-pink hover:text-pink-dark transition-colors disabled:opacity-50"
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                保存中
              </span>
            ) : editingInfo ? '保存' : '编辑'}
          </button>
        </div>

        {editingInfo ? (
          <div className="space-y-3">
            {/* Avatars in edit mode */}
            <div className="flex items-center justify-center gap-6">
              <AvatarUpload image={avatarMe} onChange={setAvatarMe} size="md" label={myName || '你'} />
              <span className="text-xl text-text-muted/30">💕</span>
              <AvatarUpload image={avatarPartner} onChange={setAvatarPartner} size="md" label={partnerName || 'TA'} />
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-text-muted mb-1 block">你的名字</label>
                <input
                  value={myName}
                  onChange={(e) => setMyName(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
              <span className="text-2xl pb-2">{coupleEmoji}</span>
              <div className="flex-1">
                <label className="text-xs text-text-muted mb-1 block">TA 的名字</label>
                <input
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>
            <div>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                max={new Date().toISOString().split('T')[0]}
                label="在一起的日子"
              />
            </div>
            <button
              onClick={() => setEditingInfo(false)}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="text-sm text-text-primary space-y-3">
            {/* Avatars in view mode */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-warm-cream">
                  {coupleInfo.avatarMe ? (
                    <img src={coupleInfo.avatarMe} alt={coupleInfo.myName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                  )}
                </div>
                <span className="text-xs text-text-muted">{coupleInfo.myName}</span>
              </div>
              <span className="text-xl">{coupleInfo.coupleEmoji || '👫'}</span>
              <div className="flex flex-col items-center gap-1">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-warm-cream">
                  {coupleInfo.avatarPartner ? (
                    <img src={coupleInfo.avatarPartner} alt={coupleInfo.partnerName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                  )}
                </div>
                <span className="text-xs text-text-muted">{coupleInfo.partnerName}</span>
              </div>
            </div>
            <p className="text-text-muted text-xs text-center">
              从 {coupleInfo.startDate} 开始，已经在一起 ❤️
            </p>
          </div>
        )}
      </section>

      {/* Milestones Section */}
      <section className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-pink-dark" />
            <h3 className="font-display font-semibold text-text-primary">纪念日</h3>
          </div>
          <button
            onClick={() => setShowNewMilestone(true)}
            className="text-xs font-medium text-pink-dark hover:text-pink-dark/80 transition-colors flex items-center gap-1"
          >
            <Plus size={14} />
            添加
          </button>
        </div>

        {showNewMilestone && (
          <motion.div
            className="bg-warm-cream rounded-xl p-3 space-y-2 mb-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex gap-2 items-center">
              <input
                value={newMsIcon}
                onChange={(e) => setNewMsIcon(e.target.value)}
                className="w-12 text-center text-xl input-field"
                maxLength={2}
                placeholder="💝"
              />
              <input
                value={newMsTitle}
                onChange={(e) => setNewMsTitle(e.target.value)}
                className="flex-1 input-field text-sm"
                placeholder="纪念日名称"
              />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <DatePicker
                  value={newMsDate}
                  onChange={setNewMsDate}
                  label="日期"
                />
              </div>
              <button onClick={handleAddMilestone} className="btn-primary py-2 px-4 text-sm mb-0.5">
                添加
              </button>
            </div>
          </motion.div>
        )}

        {state.milestones.length > 0 ? (
          <div className="space-y-2">
            {state.milestones.map((ms) => (
              <div
                key={ms.id}
                className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-warm-cream transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ms.icon || '💝'}</span>
                  <span className="text-sm text-text-primary">{ms.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{ms.date}</span>
                  {deletingMsId === ms.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          deleteMilestone(ms.id);
                          setDeletingMsId(null);
                        }}
                        className="text-xs text-red hover:text-red/80 transition-colors"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setDeletingMsId(null)}
                        className="text-xs text-text-muted hover:text-text-primary transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingMsId(ms.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-muted/30 hover:text-pink transition-all"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted/50 text-center py-4">
            还没有添加纪念日
          </p>
        )}
      </section>

      {/* Theme Section */}
      <section className="card">
        <div className="flex items-center gap-2 mb-3">
          {state.theme === 'dark' ? (
            <Moon size={18} className="text-pink" />
          ) : (
            <Sun size={18} className="text-pink" />
          )}
          <h3 className="font-display font-semibold text-text-primary">主题</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'auto'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                state.theme === t
                  ? 'bg-pink/10 text-pink ring-1 ring-pink/30'
                  : 'bg-warm-cream text-text-muted hover:text-text-primary'
              }`}
            >
              {t === 'light' ? '☀️ 亮色' : t === 'dark' ? '🌙 暗色' : '🌗 自动'}
            </button>
          ))}
        </div>
      </section>

      {/* Data Section */}
      <section className="card">
        <h3 className="font-display font-semibold text-text-primary mb-3">数据管理</h3>
        <div className="space-y-2">
          <button
            onClick={exportData}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-warm-cream transition-colors text-sm text-text-primary"
          >
            <Download size={18} className="text-text-muted" />
            导出数据备份
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-warm-cream transition-colors text-sm text-text-primary disabled:opacity-50"
          >
            {importing ? (
              <Loader2 size={18} className="text-text-muted animate-spin" />
            ) : (
              <Upload size={18} className="text-text-muted" />
            )}
            {importing ? '导入中...' : '导入数据恢复'}
          </button>

          {importMessage && (
            <motion.p
              className="text-center text-sm font-medium text-pink"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {importMessage}
            </motion.p>
          )}
        </div>
      </section>

      {/* Pairing Section */}
      <section className="card">
        <div className="flex items-center gap-2 mb-3">
          <Share2 size={18} className="text-pink" />
          <h3 className="font-display font-semibold text-text-primary">设备配对</h3>
        </div>
        <p className="text-xs text-text-muted mb-4">
          生成配对码，让另一半的设备和你的数据同步
        </p>

        {pairingCode ? (
          <div className="space-y-3">
            {/* QR Code */}
            {pairingQR && (
              <div className="flex justify-center">
                <img
                  src={pairingQR}
                  alt="配对二维码"
                  className="w-40 h-40 rounded-2xl border-2 border-pink/10"
                />
              </div>
            )}

            {/* Pairing code text */}
            <div className="bg-warm-cream rounded-xl p-3">
              <p className="text-xs text-text-muted mb-2">配对码（在另一台设备输入）：</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-text-primary break-all font-mono bg-white rounded-lg px-3 py-2">
                  {pairingCode}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pairingCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-shrink-0 p-2 rounded-xl bg-white hover:bg-pink/5 transition-colors text-text-muted hover:text-pink"
                >
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setPairingCode(null);
                setPairingQR(null);
              }}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              隐藏
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              const code = generatePairingCode();
              if (code) {
                setPairingCode(code);
                setPairingQR(generatePairingQRCode(code));
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            <Share2 size={16} />
            生成配对码
          </button>
        )}
      </section>

      {/* Danger Zone */}
      <section className="card border border-pink/10">
        {showResetConfirm ? (
          <div className="text-center">
            <p className="text-sm text-text-primary font-medium mb-1">
              确定要清除所有数据吗？
            </p>
            <p className="text-xs text-text-muted mb-3">此操作不可恢复</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-ghost text-sm"
              >
                取消
              </button>
              <button
                onClick={() => {
                  resetAll();
                  setShowResetConfirm(false);
                }}
                className="bg-red text-white py-2 px-6 rounded-xl text-sm font-medium hover:bg-red/80 transition-colors"
              >
                确认清除
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-pink/5 transition-colors text-sm text-pink"
          >
            <Trash2 size={18} />
            清除所有数据
          </button>
        )}
      </section>

      {/* Footer */}
      <p className="text-center text-xs text-text-muted/40 py-4">
        UsTime — 属于两个人的私密空间 💕
      </p>
    </motion.div>
  );
}
