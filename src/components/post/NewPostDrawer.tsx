import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Save, Loader2, Mic, Square, Play, Trash2 } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import PhotoUpload from './PhotoUpload';
import MoodPicker from './MoodPicker';
import { uploadPhotos, uploadAudio } from '../../lib/storage';
import type { Post } from '../../types';

interface NewPostDrawerProps {
  open: boolean;
  onClose: () => void;
  editingPost?: Post | null;
}

export default function NewPostDrawer({ open, onClose, editingPost }: NewPostDrawerProps) {
  const { state, addPost, editPost } = useSharedAppState();
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [audio, setAudio] = useState<string | null>(null);
  const [mood, setMood] = useState('');
  const [author, setAuthor] = useState<'me' | 'partner'>('me');
  const [showMood, setShowMood] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isEditing = !!editingPost;

  // When drawer opens with an editingPost, pre-fill the form
  useEffect(() => {
    if (open && editingPost) {
      setContent(editingPost.content);
      setPhotos(editingPost.photos);
      setAudio(editingPost.audio || null);
      setMood(editingPost.mood || '');
      setAuthor(editingPost.author);
      setShowMood(false);
    } else if (open && !editingPost) {
      // Reset for new post
      setContent('');
      setPhotos([]);
      setAudio(null);
      setMood('');
      setAuthor('me');
      setShowMood(false);
    }
  }, [open, editingPost]);

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
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

      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      // Permission denied or no mic
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!content.trim() && photos.length === 0 && !audio) return;

    setUploading(true);

    // Upload photos to Supabase Storage (skips already-uploaded URLs)
    const photoUrls = await uploadPhotos(photos);

    // Upload audio to Storage if it's base64
    let audioUrl = audio;
    if (audio && !audio.startsWith('http')) {
      const uploaded = await uploadAudio(audio);
      if (uploaded) audioUrl = uploaded;
    }

    if (isEditing && editingPost) {
      editPost(editingPost.id, {
        content: content.trim(),
        photos: photoUrls,
        audio: audioUrl || undefined,
        mood: mood || null,
      });
    } else {
      addPost({
        author,
        content: content.trim(),
        photos: photoUrls,
        audio: audioUrl || undefined,
        mood: mood || undefined,
        reactions: {},
      });
    }

    setUploading(false);
    onClose();
  };

  const canSubmit = content.trim().length > 0 || photos.length > 0 || !!audio;

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
                {isEditing ? '编辑瞬间' : '记录瞬间'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-warm-cream transition-colors"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            {/* Author toggle (only for new posts) */}
            {!isEditing && (
              <div className="px-5 pb-3">
                <div className="flex items-center gap-2 p-1 bg-warm-cream rounded-xl">
                  <button
                    onClick={() => setAuthor('me')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      author === 'me'
                        ? 'bg-white shadow-sm text-pink'
                        : 'text-text-muted'
                    }`}
                  >
                    <User size={14} />
                    {state.coupleInfo?.myName || '我'}
                  </button>
                  <button
                    onClick={() => setAuthor('partner')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      author === 'partner'
                        ? 'bg-white shadow-sm text-pink'
                        : 'text-text-muted'
                    }`}
                  >
                    <User size={14} />
                    {state.coupleInfo?.partnerName || 'TA'}
                  </button>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-5 pb-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="发生了什么有趣的事？"
                className="w-full min-h-[100px] bg-warm-cream rounded-2xl p-4 text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-pink/20 text-sm leading-relaxed"
                autoFocus
              />
            </div>

            {/* Voice Recorder */}
            <div className="px-5 pb-3">
              {audio ? (
                <div className="flex items-center gap-3 bg-warm-cream rounded-2xl p-3">
                  <button
                    onClick={() => {
                      const audioEl = document.getElementById('voice-preview') as HTMLAudioElement;
                      if (audioEl) audioEl.play();
                    }}
                    className="p-2 rounded-xl bg-pink text-white hover:bg-pink-dark transition-colors"
                  >
                    <Play size={16} />
                  </button>
                  <audio id="voice-preview" src={audio} className="hidden" />
                  <span className="text-sm text-text-primary flex-1">语音消息</span>
                  <button
                    onClick={() => setAudio(null)}
                    className="p-2 rounded-xl text-text-muted hover:text-pink transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : recording ? (
                <div className="flex items-center gap-3 bg-warm-cream rounded-2xl p-3">
                  <div className="w-3 h-3 rounded-full bg-red animate-pulse" />
                  <span className="text-sm text-pink font-medium flex-1">
                    录音中 {formatTime(recordingTime)}
                  </span>
                  <button
                    onClick={stopRecording}
                    className="p-2 rounded-xl bg-red text-white hover:bg-red/80 transition-colors"
                  >
                    <Square size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 text-sm text-text-muted hover:text-pink transition-colors"
                >
                  <Mic size={16} />
                  录制语音
                </button>
              )}
            </div>

            {/* Mood picker toggle */}
            <div className="px-5 pb-3">
              <button
                onClick={() => setShowMood(!showMood)}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                <span className="text-base">{mood || '😊'}</span>
                {mood ? '已选心情' : '标记心情'}
              </button>
              {showMood && (
                <motion.div
                  className="mt-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <MoodPicker selected={mood} onSelect={setMood} />
                </motion.div>
              )}
            </div>

            {/* Photo upload */}
            <div className="px-5 pb-3">
              <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
            </div>

            {/* Submit */}
            <div className="px-5 pb-8 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || uploading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-white transition-all ${
                  canSubmit && !uploading
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
                    {isEditing ? <Save size={18} /> : <Send size={18} />}
                    {isEditing ? '保存' : '发布'}
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
