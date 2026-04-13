import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'sonner';

export interface SavedAccount {
  uid: string;
  username: string;
  displayName: string;
  profileImage: string;
  email: string;
  // We store a token/credential hint — for real switch we re-auth
  // For UX we persist basic info so we can show the list
}

interface AccountSwitcherContextType {
  savedAccounts: SavedAccount[];
  showSwitcher: boolean;
  openSwitcher: () => void;
  closeSwitcher: () => void;
  addCurrentAccount: (uid: string) => Promise<void>;
  switchToAccount: (account: SavedAccount) => void;
  removeAccount: (uid: string) => void;
  currentUid: string | null;
}

const AccountSwitcherContext = createContext<AccountSwitcherContextType>({
  savedAccounts: [],
  showSwitcher: false,
  openSwitcher: () => {},
  closeSwitcher: () => {},
  addCurrentAccount: async () => {},
  switchToAccount: () => {},
  removeAccount: () => {},
  currentUid: null,
});

const STORAGE_KEY = 'netolynk_saved_accounts';

export const AccountSwitcherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  // Load saved accounts from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedAccounts(JSON.parse(raw));
    } catch {}
  }, []);

  // Persist whenever savedAccounts changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAccounts));
  }, [savedAccounts]);

  // Track current firebase user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  const addCurrentAccount = useCallback(async (uid: string) => {
    if (savedAccounts.some((a) => a.uid === uid)) return;
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return;
      const data = snap.data();
      const account: SavedAccount = {
        uid,
        username: data.username,
        displayName: data.displayName,
        profileImage: data.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
        email: data.email,
      };
      setSavedAccounts((prev) => {
        if (prev.some((a) => a.uid === uid)) return prev;
        return [...prev, account];
      });
    } catch (e) {
      console.error('Failed to save account', e);
    }
  }, [savedAccounts]);

  const switchToAccount = useCallback((account: SavedAccount) => {
    setShowSwitcher(false);
    if (account.uid === currentUid) return;
    // Sign out current user, then prompt login for selected account
    // Since Firebase doesn't support multi-session natively in browser,
    // we sign out and show a toast guiding the user to sign in
    signOut(auth).then(() => {
      toast.info(`Signing in as @${account.username}…`, { duration: 2000 });
      // Store pending switch so AuthForm can pre-fill
      sessionStorage.setItem('netolynk_switch_email', account.email);
    });
  }, [currentUid]);

  const removeAccount = useCallback((uid: string) => {
    setSavedAccounts((prev) => prev.filter((a) => a.uid !== uid));
  }, []);

  return (
    <AccountSwitcherContext.Provider value={{
      savedAccounts,
      showSwitcher,
      openSwitcher: () => setShowSwitcher(true),
      closeSwitcher: () => setShowSwitcher(false),
      addCurrentAccount,
      switchToAccount,
      removeAccount,
      currentUid,
    }}>
      {children}
    </AccountSwitcherContext.Provider>
  );
};

export const useAccountSwitcher = () => useContext(AccountSwitcherContext);
