import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Save, Loader2 } from 'lucide-react';
import { useSharedAppState } from '../../hooks/AppStateContext';
import AuthorToggle from '../ui/AuthorToggle';
import PhotoUpload from './PhotoUpload';
import MoodPicker from './MoodPicker';
import { uploadPhotos } from '../../lib/storage';
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
  const [mood, setMood] = useState('');
  const [author, setAuthor] = useState<'me' | 'partner'>('me');
  const [showMood, setShowMood] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEditing = !!editingPost;

  // When drawer opens with an editingPost, pre-fill the form
  useEffect(() => {
    if (open && editingPost) {
      setContent(editingPost.content);
      setPhotos(editingPost.photos);
      setMood(editingPost.mood || '');
      setAuthor(editingPost.author);
      setShowMood(false);
    } else if (open && !editingPost) {
      // Reset for new post
      setContent('');
      setPhotos([]);
      setMood('');
      setAuthor('me');
      setShowMood(false);
    }
  }, [open, editingPost]);

  const handleSubmit = async () => {
    if (!content.trim() && photos.length === 0) return;

    setUploading(true);

    // Upload photos to Supabase Storage (skips already-uploaded URLs)
    const photoUrls = await uploadPhotos(photos);

    if (isEditing && editingPost) {
      editPost(editingPost.id, {
        content: content.trim(),
        photos: photoUrls,
        audio: editingPost.audio || null,
        mood: mood || null,
      });
    } else {
      addPost({
        author,
        content: content.trim(),
        photos: photoUrls,
        audio: undefined,
        mood: mood || undefined,
        reactions: {},
      });
    }

    setUploading(false);
    onClose();
  };

  const canSubmit = content.trim().length > 0 || photos.length > 0;

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
                <AuthorToggle
                  value={author}
                  onChange={setAuthor}
                  myName={state.coupleInfo?.myName || '我'}
                  partnerName={state.coupleInfo?.partnerName || 'TA'}
                />
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
            <div className="px-5 pb-24 pt-2">
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
