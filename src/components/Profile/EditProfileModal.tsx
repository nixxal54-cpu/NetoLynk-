import React, { useState } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, isOpen, onClose }) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [profileImage, setProfileImage] = useState(user.profileImage || '');
  const [coverImage, setCoverImage] = useState(user.coverImage || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        bio,
        profileImage,
        coverImage,
        updatedAt: new Date().toISOString()
      });
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-background w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
                <h3 className="font-bold text-xl">Edit Profile</h3>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-foreground text-background px-6 py-1.5 rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-0">
              <div className="relative h-32 bg-accent/50 group cursor-pointer">
                {coverImage && <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-70" />}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <input 
                  type="text" 
                  value={coverImage} 
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Cover Image URL"
                  className="absolute bottom-2 right-2 bg-black/50 text-white text-xs p-1 rounded border-none outline-none w-32"
                />
              </div>

              <div className="px-4 relative">
                <div className="absolute -top-12 left-4 w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-accent group cursor-pointer">
                  <img src={profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Profile" className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="pt-16 space-y-4 pb-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground ml-1">Profile Image URL</label>
                    <input
                      type="text"
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      className="w-full mt-1 px-4 py-2 rounded-xl bg-accent/30 border border-border focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground ml-1">Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full mt-1 px-4 py-2 rounded-xl bg-accent/30 border border-border focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground ml-1">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full mt-1 px-4 py-2 rounded-xl bg-accent/30 border border-border focus:border-primary outline-none transition-all resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
