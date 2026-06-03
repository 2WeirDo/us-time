import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Link } from 'lucide-react';
import { saveSupabaseConfig, getSupabase } from '../../lib/supabase';
import { decodePairingCode, savePairingCredentials } from '../../lib/pairing';

interface SupabaseSetupProps {
  onComplete: () => void;
}

export default function SupabaseSetup({ onComplete }: SupabaseSetupProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [showPairingInput, setShowPairingInput] = useState(false);
  const [pairingInput, setPairingInput] = useState('');

  const handleConnect = async () => {
    setError('');
    setTesting(true);

    try {
      saveSupabaseConfig(url.trim(), anonKey.trim());

      const sb = getSupabase();
      if (!sb) {
        setError('无法创建连接');
        setTesting(false);
        return;
      }

      const { error: testError } = await sb.from('couple_settings').select('id').limit(1);

      if (testError && testError.code !== '42P01') {
        setError(`连接失败: ${testError.message}`);
        setTesting(false);
        return;
      }

      onComplete();
    } catch (e) {
      setError(`连接失败: ${e instanceof Error ? e.message : '未知错误'}`);
    }

    setTesting(false);
  };

  const handlePairingCode = async () => {
    setError('');
    const data = decodePairingCode(pairingInput);
    if (!data) {
      setError('配对码无效，请检查后重试');
      return;
    }
    savePairingCredentials(data.url, data.key);
    setTesting(true);

    const sb = getSupabase();
    if (!sb) {
      setError('无法创建连接，请检查配对码');
      setTesting(false);
      return;
    }

    // Quick test
    try {
      const { error: testError } = await sb.from('couple_settings').select('id').limit(1);
      if (testError && testError.code !== '42P01') {
        setError(`连接失败: ${testError.message}`);
        setTesting(false);
        return;
      }
      onComplete();
    } catch {
      setError('连接失败');
      setTesting(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[80vh] px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-6xl mb-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        🗄️
      </motion.div>

      <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
        连接 Supabase
      </h2>
      <p className="text-text-muted text-sm text-center mb-8 max-w-xs">
        需要先创建 Supabase 项目来存储你们的数据
      </p>

      <div className="w-full max-w-sm space-y-4">
        {/* Pairing code toggle */}
        {!showPairingInput ? (
          <>
            {/* Guide */}
            <div className="card bg-pink/5 border border-pink/10 text-sm text-text-primary space-y-2">
              <p className="font-medium">📋 如何获取：</p>
              <ol className="space-y-1 text-text-muted">
                <li>1. 打开 <a href="https://supabase.com" target="_blank" className="text-pink underline">supabase.com</a> 注册免费账号</li>
                <li>2. 创建新项目（Create new project）</li>
                <li>3. 进入 Settings → API</li>
                <li>4. 复制 Project URL 和 anon/public key</li>
              </ol>
              <a
                href="https://supabase.com/dashboard/projects"
                target="_blank"
                className="flex items-center gap-1 text-pink text-xs mt-1 hover:underline"
              >
                打开 Supabase Dashboard <ExternalLink size={12} />
              </a>
            </div>

            {/* URL input */}
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Project URL (https://xxx.supabase.co)"
              className="input-field text-sm"
              autoFocus
            />

            {/* Anon key input */}
            <input
              type="text"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="anon public key"
              className="input-field text-sm"
            />

            <button
              onClick={handleConnect}
              disabled={!url.trim() || !anonKey.trim() || testing}
              className={`w-full btn-primary flex items-center justify-center gap-2 ${
                !url.trim() || !anonKey.trim() ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {testing ? '连接中...' : '连接数据库'}
              {!testing && <ArrowRight size={18} />}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-text-muted/10" />
              <span className="text-xs text-text-muted/50">或者</span>
              <div className="flex-1 h-px bg-text-muted/10" />
            </div>

            <button
              onClick={() => setShowPairingInput(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-pink/20 text-pink text-sm font-medium hover:bg-pink/5 transition-colors"
            >
              <Link size={16} />
              使用配对码连接
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-text-primary text-center">
              输入另一半分享的配对码
            </p>
            <textarea
              value={pairingInput}
              onChange={(e) => setPairingInput(e.target.value)}
              placeholder="粘贴配对码..."
              className="input-field text-xs font-mono h-24 resize-none"
              autoFocus
            />

            {error && (
              <motion.p
                className="text-pink text-sm text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            <button
              onClick={handlePairingCode}
              disabled={!pairingInput.trim() || testing}
              className={`w-full btn-primary flex items-center justify-center gap-2 ${
                !pairingInput.trim() ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {testing ? '验证中...' : '连接'}
              {!testing && <ArrowRight size={18} />}
            </button>

            <button
              onClick={() => {
                setShowPairingInput(false);
                setError('');
              }}
              className="w-full text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              返回手动配置
            </button>
          </>
        )}

        {error && !showPairingInput && (
          <motion.p
            className="text-pink text-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
