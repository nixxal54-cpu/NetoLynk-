import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Image as ImageIcon, Loader2, Smile } from 'lucide-react';
import { getMoodIconByLabel } from '../components/Feed/PostCard';

const MOODS = [
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😌', label: 'Peaceful' },
  { emoji: '💀', label: 'Dead inside' },
  { emoji: '🔥', label: 'Hyped' },
  { emoji: '✨', label: 'Feeling cute' },
  { emoji: '☕', label: 'Need coffee' },
  { emoji: '😭', label: 'Crying' },
  { emoji: '🚀', label: 'Productive' },
];

export const CreatePostPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMood, setSelectedMood] = useState<{emoji: string, label: string} | null>(null);
  const [showMoods, setShowMoods] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        username: user.username,
        userProfileImage: user.profileImage || null,
        text: text.trim(),
        mediaUrls: [],
        type: 'text',
        mood: selectedMood,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        likedBy: [],
        savedBy: [],
        tags: [],
        mentions: [],
        createdAt: new Date().toISOString(),
        serverCreatedAt: serverTimestamp()
      });
      toast.success('Post shared successfully!');
      navigate('/');
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error('Failed to share post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 max-w-2xl border-x border-border min-h-screen bg-background"
    >
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold">New Post</h2>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting}
          className="bg-primary text-primary-foreground px-6 py-1.5 rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Post
        </button>
      </header>

      <div className="p-4 flex gap-4">
        <img 
          src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
          alt="Profile" 
          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1">
          {selectedMood && (
            <div className="mb-2 inline-flex items-center gap-2 bg-accent/50 px-3 py-1.5 rounded-full text-sm font-medium border border-border/50">
              {getMoodIconByLabel(selectedMood.label)}
              <span>Feeling {selectedMood.label.toLowerCase()}</span>
              <button 
                onClick={() => setSelectedMood(null)}
                className="ml-2 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={selectedMood ? `Why are you feeling ${selectedMood.label.toLowerCase()}?` : "What's happening?"}
            className="w-full bg-transparent text-xl outline-none resize-none min-h-[150px] placeholder:text-muted-foreground/60 text-base"
            autoFocus
          />
          
          <div className="border-t border-border pt-4 flex items-center gap-4 relative">
            <button className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors">
              <ImageIcon className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setShowMoods(!showMoods)}
              className={`p-2 rounded-full transition-colors flex items-center gap-2 ${showMoods || selectedMood ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}
            >
              <Smile className="w-6 h-6" />
            </button>

            <AnimatePresence>
              {showMoods && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-14 left-0 bg-card border border-border rounded-2xl shadow-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 z-50 w-full max-w-sm"
                >
                  {MOODS.map(mood => (
                    <button
                      key={mood.label}
                      onClick={() => {
                        setSelectedMood(mood);
                        setShowMoods(false);
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent transition-colors"
                    >
                      <div className="transform scale-150">
                        {getMoodIconByLabel(mood.label)}
                      </div>
                      <span className="text-xs font-medium text-center">{mood.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
