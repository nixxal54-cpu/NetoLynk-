import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { toast } from 'sonner';

export interface SavedAccount {
  uid: string;
  username: string;
  displayName: string;
  profileImage: string;
  email: string;
  secret?: string; // base64 encoded password for seamless switching
}

interface AccountSwitcherContextType {
  savedAccounts: SavedAccount[];
  showSwitcher: boolean;
  openSwitcher: () => void;
  closeSwitcher: () => void;
  addCurrentAccount: (uid: string, secret?: string) => Promise<void>;
  removeAccount: (uid: string) => void;
  logoutCurrentAccount: () => Promise<void>;
  currentUid: string | null;
}

const AccountSwitcherContext = createContext<AccountSwitcherContextType>({
  savedAccounts: [],
  showSwitcher: false,
  openSwitcher: () => {},
  closeSwitcher: () => {},
  addCurrentAccount: async () => {},
  removeAccount: () => {},
  logoutCurrentAccount: async () => {},
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

  const addCurrentAccount = useCallback(async (uid: string, secret?: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return;
      const data = snap.data();
      
      setSavedAccounts((prev) => {
        const existing = prev.find((a) => a.uid === uid);
        const newAccount: SavedAccount = {
          uid,
          username: data.username,
          displayName: data.displayName,
          profileImage: data.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
          email: data.email,
          secret: secret || existing?.secret,
        };

        if (existing) {
          return prev.map((a) => a.uid === uid ? { ...a, ...newAccount } : a);
        }
        return [...prev, newAccount];
      });
    } catch (e) {
      console.error('Failed to save account', e);
    }
  }, []);

  // Track current firebase user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUid(u?.uid ?? null);
      if (u?.uid) addCurrentAccount(u.uid);
    });
    return () => unsub();
  }, [addCurrentAccount]);

  const removeAccount = useCallback((uid: string) => {
    setSavedAccounts((prev) => prev.filter((a) => a.uid !== uid));
  }, []);

  const logoutCurrentAccount = useCallback(async () => {
    if (currentUid) {
      removeAccount(currentUid); // Remove from device on logout
    }
    
    // Check if there is another account we can auto-switch to
    const remaining = savedAccounts.filter(a => a.uid !== currentUid);
    const nextPassAcc = remaining.find(a => a.secret);
    
    if (nextPassAcc) {
      try {
        await signInWithEmailAndPassword(auth, nextPassAcc.email, atob(nextPassAcc.secret!));
        toast.success(`Switched to @${nextPassAcc.username}`);
        return;
      } catch (e) {
        console.error('Auto-switch failed', e);
      }
    }
    
    // Default sign out if no auto-switch is possible
    await signOut(auth);
    toast.success('Signed out');
  }, [currentUid, savedAccounts, removeAccount]);

  return (
    <AccountSwitcherContext.Provider value={{
      savedAccounts,
      showSwitcher,
      openSwitcher: () => setShowSwitcher(true),
      closeSwitcher: () => setShowSwitcher(false),
      addCurrentAccount,
      removeAccount,
      logoutCurrentAccount,
      currentUid,
    }}>
      {children}
    </AccountSwitcherContext.Provider>
  );
};

export const useAccountSwitcher = () => useContext(AccountSwitcherContext);
