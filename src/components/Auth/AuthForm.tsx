import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const baseUsername = user.email?.split('@')[0] || 'user';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: `${baseUsername}_${Math.floor(Math.random() * 1000)}`,
          displayName: user.displayName || baseUsername,
          email: user.email,
          bio: '',
          profileImage: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          coverImage: 'https://picsum.photos/seed/netolynk/1200/400',
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          createdAt: new Date().toISOString(),
          serverCreatedAt: serverTimestamp()
        });
      }
      toast.success('Welcome to Netolynk!');
    } catch (error: any) {
      console.error("Google Auth error:", error);
      toast.error(error.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });

        // Create user document in Firestore
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

        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-md w-full p-8 bg-card rounded-3xl shadow-2xl border border-border"
    >
      <div className="text-center mb-8">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-primary tracking-tighter"
        >
          NETOLYNK
        </motion.h2>
        <p className="text-muted-foreground mt-2">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div>
                <label className="text-sm font-medium ml-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-accent/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base"
                  placeholder="johndoe"
                />
              </div>
              <div>
                <label className="text-sm font-medium ml-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full mt-1 px-4 py-3 rounded-xl bg-accent/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base"
                  placeholder="John Doe"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label className="text-sm font-medium ml-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-accent/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium ml-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-accent/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base"
            placeholder="••••••••"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
        </motion.button>
      </form>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-xs text-muted-foreground uppercase font-bold">OR</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full mt-4 py-3 bg-white text-black border border-border rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        Continue with Google
      </motion.button>

      <div className="mt-6 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary hover:underline font-medium"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </motion.div>
  );
};
