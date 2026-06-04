import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Mic, Square, Play, Trash2, AlertCircle } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import AuthorToggle from '../ui/AuthorToggle';
import { useToast } from '../ui/Toast';
import { uploadAudio } from '../../lib/storage';

interface VoiceRecordDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function VoiceRecordDrawer({ open, onClose }: VoiceRecordDrawerProps) {
  const { state, addPost } = useSharedAppState();
  const { toast } = useToast();
  const [author, setAuthor] = useState<'me' | 'partner'>('me');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audio, setAudio] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setAudio(null);
      setRecording(false);
      setRecordingTime(0);
      setError('');
      setAuthor('me');
    }
  }, [open]);

  // Clean up recorder on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Try webm first, fallback to whatever is available
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blobType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: blobType });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudio(reader.result as string);
        };
        reader.readAsDataURL(blob);
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.onerror = () => {
        setError('录音失败，请重试');
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (e) {
      const err = e as DOMException;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
      } else if (err.name === 'NotFoundError') {
        setError('未检测到麦克风设备');
      } else {
        setError('无法启动录音，请检查设备权限');
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setAudio(null);
    setRecordingTime(0);
    setError('');
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!audio) return;
    setError('');
    setUploading(true);

    try {
      // Upload audio to Storage (try, but fallback to base64 if fails)
      let audioUrl: string = audio;
      if (!audio.startsWith('http')) {
        const uploaded = await uploadAudio(audio);
        if (uploaded) {
          audioUrl = uploaded;
        } else {
          // Upload failed — keep base64 as fallback so the post still works
          console.warn('Voice upload to storage failed, using base64 fallback');
          toast('语音上传至存储失败，使用本地备份发布', 'info');
        }
      }

      await addPost({
        author,
        content: '',
        photos: [],
        audio: audioUrl,
        mood: undefined,
        reactions: {},
      });

      setUploading(false);
      onClose();
    } catch (e) {
      console.error('VoiceRecordDrawer submit error:', e);
      toast('发布失败，请重试', 'error');
      setUploading(false);
    }
  };

  const canSubmit = !!audio && !uploading;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-w-lg mx-auto shadow-lift"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-text-muted/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="font-display text-lg font-bold text-text-primary">
                录制语音
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-warm-cream transition-colors"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            {/* Author toggle */}
            <div className="px-5 pb-4">
              <AuthorToggle
                value={author}
                onChange={setAuthor}
                myName={state.coupleInfo?.myName || '我'}
                partnerName={state.coupleInfo?.partnerName || 'TA'}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="px-5 pb-3">
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="text-red flex-shrink-0" />
                  <p className="text-sm text-red">{error}</p>
                </div>
              </div>
            )}

            {/* Recording area */}
            <div className="px-5 pb-6">
              {audio ? (
                /* Preview mode */
                <div className="flex flex-col items-center gap-4 bg-warm-cream rounded-3xl p-6">
                  <div className="w-16 h-16 rounded-full bg-pink/10 flex items-center justify-center">
                    <Mic size={28} className="text-pink" />
                  </div>
                  <p className="text-sm text-text-primary font-medium">语音录制完成</p>
                  <p className="text-xs text-text-muted">时长 {formatTime(recordingTime)}</p>

                  {/* Audio player */}
                  <div className="w-full flex items-center gap-3 bg-white rounded-2xl p-3">
                    <button
                      onClick={() => {
                        const audioEl = document.getElementById('voice-preview') as HTMLAudioElement;
                        if (audioEl) {
                          if (audioEl.paused) {
                            audioEl.play();
                          } else {
                            audioEl.pause();
                          }
                        }
                      }}
                      className="p-2.5 rounded-xl bg-pink text-white hover:bg-pink-dark transition-colors"
                    >
                      <Play size={18} />
                    </button>
                    <audio id="voice-preview" src={audio} className="hidden" />
                    <div className="flex-1 h-2 bg-warm-cream rounded-full overflow-hidden">
                      <div className="h-full bg-pink rounded-full" style={{ width: '60%' }} />
                    </div>
                    <span className="text-xs text-text-muted">{formatTime(recordingTime)}</span>
                  </div>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => {
                        setAudio(null);
                        setRecordingTime(0);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-text-muted hover:text-pink transition-colors text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      重新录制
                    </button>
                  </div>
                </div>
              ) : recording ? (
                /* Recording mode */
                <div className="flex flex-col items-center gap-4 bg-warm-cream rounded-3xl p-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-red/10 flex items-center justify-center">
                      <Mic size={36} className="text-red" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-red/30"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-lg font-bold text-red font-mono">
                    {formatTime(recordingTime)}
                  </p>
                  <p className="text-sm text-text-muted">正在录音...</p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={cancelRecording}
                      className="flex-1 py-2.5 rounded-xl bg-white text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
                    >
                      取消
                    </button>
                    <button
                      onClick={stopRecording}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red text-white hover:bg-red/80 transition-colors text-sm font-medium"
                    >
                      <Square size={16} />
                      停止录音
                    </button>
                  </div>
                </div>
              ) : (
                /* Idle mode - start recording */
                <button
                  onClick={startRecording}
                  className="w-full flex flex-col items-center gap-4 bg-warm-cream rounded-3xl p-8 hover:bg-pink/5 transition-colors group"
                >
                  <div className="w-20 h-20 rounded-full bg-pink/10 flex items-center justify-center group-hover:bg-pink/20 transition-colors">
                    <Mic size={36} className="text-pink" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-text-primary font-medium">点击开始录音</p>
                    <p className="text-xs text-text-muted mt-1">录制一段语音消息给对方</p>
                  </div>
                </button>
              )}
            </div>

            {/* Submit */}
            <div className="px-5 pb-24 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white transition-all ${
                  canSubmit
                    ? 'bg-gradient-to-r from-pink to-pink-dark shadow-soft hover:shadow-card active:scale-[0.98]'
                    : 'bg-text-muted/20 cursor-not-allowed'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    发布语音
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
