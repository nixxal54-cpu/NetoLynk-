import React, { useState, useRef } from 'react';
import { X, Camera, Loader2, Upload } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
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
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState(user.profileImage || '');
  const [coverPreview, setCoverPreview] = useState(user.coverImage || '');
  const [loading, setLoading] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      let finalProfileImage = profileImage;
      let finalCoverImage = coverImage;

      if (profileFile) {
        const storageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(storageRef, profileFile);
        finalProfileImage = await getDownloadURL(storageRef);
      }

      if (coverFile) {
        const storageRef = ref(storage, `coverImages/${user.uid}`);
        await uploadBytes(storageRef, coverFile);
        finalCoverImage = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        bio,
        profileImage: finalProfileImage,
        coverImage: finalCoverImage,
        updatedAt: new Date().toISOString()
      });
      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
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
              <button onClick={handleSubmit} disabled={loading}
                className="bg-foreground text-background px-6 py-1.5 rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Cover image */}
              <div className="relative h-36 bg-accent/50 group cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                {coverPreview && (
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col items-center gap-1 text-white">
                    <Camera className="w-8 h-8" />
                    <span className="text-xs font-medium">Change cover photo</span>
                  </div>
                </div>
                {!coverPreview && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8" />
                      <span className="text-sm">Click to add cover photo</span>
                    </div>
                  </div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverPick} className="hidden" />
              </div>

              {/* Profile image */}
              <div className="px-4 relative">
                <div
                  className="absolute -top-14 left-4 w-28 h-28 rounded-full border-4 border-background overflow-hidden bg-accent group cursor-pointer"
                  onClick={() => profileInputRef.current?.click()}
                >
                  <img
                    src={profilePreview || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-7 h-7 text-white" />
                  </div>
                  <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfilePick} className="hidden" />
                </div>

                <div className="pt-18 space-y-4 pb-6" style={{ paddingTop: '4.5rem' }}>
                  {(profileFile || coverFile) && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-500 text-sm">
                      ✓ {[profileFile && 'Profile photo', coverFile && 'Cover photo'].filter(Boolean).join(' & ')} ready to upload
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground ml-1">Name</label>
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                      className="w-full mt-1 px-4 py-2 rounded-xl bg-accent/30 border border-border focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground ml-1">Bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                      className="w-full mt-1 px-4 py-2 rounded-xl bg-accent/30 border border-border focus:border-primary outline-none transition-all resize-none"
                      placeholder="Tell us about yourself..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground ml-1">Profile Image URL (optional)</label>
                    <input type="text" value={profileImage} onChange={e => { setProfileImage(e.target.value); setProfilePreview(e.target.value); }}
                      className="w-full mt-1 px-4 py-2 rounded-xl bg-accent/30 border border-border focus:border-primary outline-none transition-all"
                      placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground ml-1">Cover Image URL (optional)</label>
                    <input type="text" value={coverImage} onChange={e => { setCoverImage(e.target.value); setCoverPreview(e.target.value); }}
                      className="w-full mt-1 px-4 py-2 rounded-xl bg-accent/30 border border-border focus:border-primary outline-none transition-all"
                      placeholder="https://..." />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
