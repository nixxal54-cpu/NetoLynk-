import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, X, LogOut, ChevronRight, UserCircle2 } from 'lucide-react';
import { useAccountSwitcher, SavedAccount } from '../context/AccountSwitcherContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const AccountSwitcher: React.FC = () => {
  const { savedAccounts, showSwitcher, closeSwitcher, switchToAccount, removeAccount, currentUid } = useAccountSwitcher();
  const { user } = useAuth();
  const navigate = useNavigate();
  const backdropRef = useRef<HTMLDivElement>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Close on backdrop tap
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) closeSwitcher();
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (showSwitcher) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showSwitcher]);

  const handleSwitch = (account: SavedAccount) => {
    if (account.uid === currentUid) {
      // Already this account — navigate to profile
      navigate(`/profile/${account.username}`);
      closeSwitcher();
      return;
    }
    switchToAccount(account);
  };

  const handleRemove = (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    setRemovingId(uid);
    setTimeout(() => {
      removeAccount(uid);
      setRemovingId(null);
      toast.success('Account removed');
    }, 300);
  };

  const handleAddAccount = () => {
    closeSwitcher();
    auth.signOut();
    toast.info('Sign in with another account');
  };

  const handleLogout = () => {
    closeSwitcher();
    auth.signOut();
    toast.success('Signed out');
  };

  // Split: current account first, others after
  const currentAccount = savedAccounts.find((a) => a.uid === currentUid);
  const otherAccounts = savedAccounts.filter((a) => a.uid !== currentUid);

  // Fallback: if current user isn't in savedAccounts yet, build from user context
  const displayCurrent = currentAccount ?? (user ? {
    uid: user.uid,
    username: user.username,
    displayName: user.displayName,
    profileImage: user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
    email: user.email,
  } : null);

  return (
    <AnimatePresence>
      {showSwitcher && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={backdropRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[201] bg-[#1a1a1a] rounded-t-3xl overflow-hidden shadow-2xl max-w-lg mx-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Accounts list */}
            <div className="px-2 pt-2 pb-1">

              {/* Current account */}
              {displayCurrent && (
                <motion.button
                  key={displayCurrent.uid}
                  onClick={() => { navigate(`/profile/${displayCurrent.username}`); closeSwitcher(); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={displayCurrent.profileImage}
                      alt={displayCurrent.username}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-primary"
                    />
                    {/* Online dot */}
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-[#1a1a1a]" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-white text-[15px] truncate">{displayCurrent.username}</p>
                    <p className="text-[13px] text-white/50 truncate">{displayCurrent.displayName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[11px] text-white/40">Active now</span>
                    </div>
                  </div>
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                </motion.button>
              )}

              {/* Divider */}
              {otherAccounts.length > 0 && (
                <div className="mx-4 my-1 border-t border-white/5" />
              )}

              {/* Other saved accounts */}
              <AnimatePresence>
                {otherAccounts.map((account) => (
                  <motion.div
                    key={account.uid}
                    initial={{ opacity: 1, height: 'auto' }}
                    animate={{ opacity: removingId === account.uid ? 0 : 1, height: removingId === account.uid ? 0 : 'auto' }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <button
                      onClick={() => handleSwitch(account)}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors group"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={account.profileImage}
                          alt={account.username}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10"
                        />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-white text-[15px] truncate">{account.username}</p>
                        <p className="text-[13px] text-white/50 truncate">{account.displayName}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">Tap to switch</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleRemove(e, account.uid)}
                          className="p-1.5 rounded-full text-white/30 hover:text-white/70 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </div>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="px-4 pb-2 pt-1 space-y-1 border-t border-white/5">
              {/* Add account */}
              <button
                onClick={handleAddAccount}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-7 h-7 text-white/70" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white text-[15px]">Add account</p>
                  <p className="text-[13px] text-white/40">Sign in with another account</p>
                </div>
              </button>

              {/* Log out */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-6 h-6 text-white/40" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white/70 text-[15px]">Log out</p>
                  <p className="text-[13px] text-white/30">@{displayCurrent?.username}</p>
                </div>
              </button>
            </div>

            {/* Meta-style footer */}
            <div className="flex items-center justify-center gap-2 py-4 pb-8">
              <span className="text-[12px] text-white/20 font-medium tracking-widest uppercase">Netolynk</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
