import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useAccountSwitcher, SavedAccount } from '../../context/AccountSwitcherContext';
import { ChevronRight, Loader2 } from 'lucide-react';

export const AuthForm: React.FC = () => {
  const { savedAccounts, addCurrentAccount } = useAccountSwitcher();
  const [showSaved, setShowSaved] = useState(savedAccounts.length > 0);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSavedLogin = async (acc: SavedAccount) => {
    setSwitchingId(acc.uid);
    try {
      if (acc.secret) {
        await signInWithEmailAndPassword(auth, acc.email, atob(acc.secret));
        toast.success(`Welcome back @${acc.username}`);
      } else {
        setShowSaved(false);
        setEmail(acc.email);
        toast.info('Please enter your password');
      }
    } catch (err: any) {
      toast.error('Session expired. Please log in again.');
      setShowSaved(false);
      setEmail(acc.email);
    } finally {
      setSwitchingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        await addCurrentAccount(res.user.uid, btoa(password));
        toast.success('Welcome back!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: username.toLowerCase().replace(/\s/g, ''),
          displayName,
          email,
          bio: '',
          profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          coverImage: 'https://picsum.photos/seed/netolynk/1200/400',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          createdAt: new Date().toISOString(),
          serverCreatedAt: serverTimestamp()
        });

        await addCurrentAccount(user.uid, btoa(password));
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (showSaved && savedAccounts.length > 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-w-md w-full p-8 bg-card rounded-3xl shadow-2xl border border-border"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        <div className="space-y-3">
          {savedAccounts.map(acc => (
            <button
              key={acc.uid}
              onClick={() => handleSavedLogin(acc)}
              disabled={switchingId !== null}
              className="w-full flex items-center gap-4 p-4 bg-accent/50 hover:bg-accent rounded-2xl transition-colors group text-left"
            >
              <img src={acc.profileImage} className="w-12 h-12 rounded-full object-cover" alt="Profile" />
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{acc.displayName}</p>
                <p className="text-sm text-muted-foreground truncate">@{acc.username}</p>
              </div>
              {switchingId === acc.uid ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setShowSaved(false)}
          className="w-full mt-6 text-primary font-medium hover:underline text-sm"
        >
          Log into another account
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-md w-full p-8 bg-card rounded-3xl shadow-2xl border border-border"
    >
      <div className="text-center mb-8">
        <motion.h2 className="text-4xl font-bold text-primary tracking-tighter">NETOLYNK</motion.h2>
        <p className="text-muted-foreground mt-2">{isLogin ? 'Sign in to your account' : 'Create your account'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden">
              <div>
                <label className="text-sm font-medium ml-1">Username</label>
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-xl bg-accent/50 border border-border focus:border-primary outline-none" placeholder="johndoe" />
              </div>
              <div>
                <label className="text-sm font-medium ml-1">Display Name</label>
                <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-xl bg-accent/50 border border-border focus:border-primary outline-none" placeholder="John Doe" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="text-sm font-medium ml-1">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-xl bg-accent/50 border border-border focus:border-primary outline-none" placeholder="name@example.com" />
        </div>

        <div>
          <label className="text-sm font-medium ml-1">Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-xl bg-accent/50 border border-border focus:border-primary outline-none" placeholder="••••••••" />
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 disabled:opacity-50">
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </motion.button>
      </form>

      <div className="mt-6 text-center">
        <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>

      {savedAccounts.length > 0 && (
        <button onClick={() => setShowSaved(true)} className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground hover:underline">
          View saved accounts
        </button>
      )}
    </motion.div>
  );
};
