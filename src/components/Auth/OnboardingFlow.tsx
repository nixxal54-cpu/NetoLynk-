import React, { useState, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useAccountSwitcher } from '../../context/AccountSwitcherContext';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Shield,
  Sparkles,
  User,
  Mail,
  AtSign,
  Users,
  ChevronRight
} from 'lucide-react';

interface OnboardingData {
  email: string;
  password: string;
  birthday: { day: string; month: string; year: string };
  name: string;
  username: string;
  profileImageFile: File | null;
  profileImagePreview: string;
  privacy: 'private' | 'public';
}

interface OnboardingFlowProps {
  onBack: () => void;
}

const TOTAL_STEPS = 9; // email, password, birthday, privacy+terms, name, username, profile pic, follow suggestions, all set

const progressPercent = (step: number) => Math.round((step / (TOTAL_STEPS - 1)) * 100);

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const SUGGESTED_ACCOUNTS = [
  { username: 'neas_ting', displayName: "Nea's Ting", avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neas' },
  { username: 'metalbent_', displayName: 'Metalbent', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=metalbent' },
  { username: '_a.r.t.i.s', displayName: 'A.R.T.I.S.', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artis' },
  { username: 'mrsovo.1', displayName: 'RIYAH♾PRIVV', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mrsovo' },
  { username: 'sempre_makina', displayName: 'Sempre makina', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sempre' },
  { username: 'netolynk_official', displayName: 'NetoLynk Official', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=netolynk' },
  { username: 'techvibes', displayName: 'Tech Vibes', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techvibes' },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onBack }) => {
  const { addCurrentAccount } = useAccountSwitcher();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<OnboardingData>({
    email: '',
    password: '',
    birthday: { day: '', month: 'January', year: '' },
    name: '',
    username: '',
    profileImageFile: null,
    profileImagePreview: '',
    privacy: 'private',
  });

  const [followSelected, setFollowSelected] = useState<Set<string>>(
    new Set(SUGGESTED_ACCOUNTS.slice(0, 5).map(a => a.username))
  );

  const goNext = () => {
    setDirection('forward');
    setStep(s => s + 1);
  };
  const goBack = () => {
    setDirection('back');
    if (step === 0) onBack();
    else setStep(s => s - 1);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setData(d => ({ ...d, profileImageFile: file, profileImagePreview: preview }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      let profileImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`;

      if (data.profileImageFile) {
        const storageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(storageRef, data.profileImageFile);
        profileImageUrl = await getDownloadURL(storageRef);
      }

      await updateProfile(user, { displayName: data.name, photoURL: profileImageUrl });

      const birthday = `${data.birthday.year}-${String(MONTHS.indexOf(data.birthday.month) + 1).padStart(2, '0')}-${String(data.birthday.day).padStart(2, '0')}`;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username: data.username.toLowerCase().replace(/\s/g, ''),
        displayName: data.name,
        email: data.email,
        bio: '',
        birthday,
        privacy: data.privacy,
        profileImage: profileImageUrl,
        coverImage: 'https://picsum.photos/seed/netolynk/1200/400',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isNewUser: true,
        createdAt: new Date().toISOString(),
        serverCreatedAt: serverTimestamp()
      });

      await addCurrentAccount(user.uid, btoa(data.password));
      goNext(); // go to "All Set" page
    } catch (error: any) {
      toast.error(error.message || 'Account creation failed');
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: (dir: 'forward' | 'back') => ({
      x: dir === 'forward' ? 60 : -60,
      opacity: 0
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 'forward' | 'back') => ({
      x: dir === 'forward' ? -60 : 60,
      opacity: 0
    }),
  };

  const inputClass = "w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 focus:border-blue-500 outline-none transition-all text-white placeholder:text-white/30 text-base";
  const labelClass = "block text-sm font-medium text-white/60 mb-1.5 ml-1";

  const canProceed = () => {
    switch (step) {
      case 0: return data.email.includes('@') && data.email.includes('.');
      case 1: return data.password.length >= 6;
      case 2: return data.birthday.day && data.birthday.year.length === 4;
      case 3: return true;
      case 4: return data.name.trim().length >= 2;
      case 5: return data.username.trim().length >= 3;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-black text-white">
      {/* Progress bar */}
      {step < TOTAL_STEPS - 1 && (
        <div className="w-full h-0.5 bg-white/10">
          <motion.div
            className="h-full bg-blue-500"
            animate={{ width: `${progressPercent(step)}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      {/* Header */}
      {step < TOTAL_STEPS - 1 && (
        <div className="flex items-center px-4 pt-4 pb-2">
          <button onClick={goBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex justify-center">
            <span className="text-lg font-bold tracking-tight text-blue-400">NetoLynk</span>
          </div>
          <div className="w-9" />
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className="flex-1 flex flex-col px-6 pt-4 pb-8 max-w-md mx-auto w-full"
        >

          {/* Step 0: Email */}
          {step === 0 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-5">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">What's your email?</h1>
                <p className="text-white/50">Enter the email you'd like to use for your NetoLynk account.</p>
              </div>
              <div>
                <label className={labelClass}>Email address</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={e => setData(d => ({ ...d, email: e.target.value }))}
                  className={inputClass}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <div className="flex-1" />
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Password */}
          {step === 1 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6 text-purple-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Create a password</h1>
                <p className="text-white/50">Use at least 6 characters with a mix of letters and numbers.</p>
              </div>
              <div className="relative">
                <label className={labelClass}>Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={data.password}
                  onChange={e => setData(d => ({ ...d, password: e.target.value }))}
                  className={inputClass + ' pr-12'}
                  placeholder="••••••••"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-4 top-[42px] text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {data.password && (
                <div className="mt-3 flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      data.password.length >= i * 3
                        ? i <= 2 ? 'bg-red-500' : i === 3 ? 'bg-yellow-500' : 'bg-green-500'
                        : 'bg-white/10'
                    }`} />
                  ))}
                </div>
              )}
              <div className="flex-1" />
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Birthday */}
          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-8">
                <div className="text-4xl mb-5">🎂</div>
                <h1 className="text-3xl font-bold mb-2">What's your birthday?</h1>
                <p className="text-white/50">Use your own birthday, even if this account is for a business, a pet, or something else. This won't be part of your public profile.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Month</label>
                  <select
                    value={data.birthday.month}
                    onChange={e => setData(d => ({ ...d, birthday: { ...d.birthday, month: e.target.value } }))}
                    className={inputClass + ' appearance-none'}
                  >
                    {MONTHS.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                  </select>
                </div>
                <div className="w-20">
                  <label className={labelClass}>Day</label>
                  <input
                    type="number"
                    min="1" max="31"
                    value={data.birthday.day}
                    onChange={e => setData(d => ({ ...d, birthday: { ...d.birthday, day: e.target.value } }))}
                    className={inputClass}
                    placeholder="DD"
                  />
                </div>
                <div className="w-24">
                  <label className={labelClass}>Year</label>
                  <input
                    type="number"
                    min="1900" max={new Date().getFullYear()}
                    value={data.birthday.year}
                    onChange={e => setData(d => ({ ...d, birthday: { ...d.birthday, year: e.target.value } }))}
                    className={inputClass}
                    placeholder="YYYY"
                  />
                </div>
              </div>
              <p className="text-white/30 text-xs mt-3 leading-relaxed">
                You need to enter the birthday of the person using this account, even if this account is for a business, a pet, or something else.
              </p>
              <div className="flex-1" />
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 3: Privacy & Terms */}
          {step === 3 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mb-5">
                  <Shield className="w-6 h-6 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Privacy & Terms</h1>
                <p className="text-white/50 text-sm">By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
              </div>

              {/* Account Privacy */}
              <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/10">
                <h3 className="font-bold mb-3 text-white">Set your account privacy</h3>
                {[
                  { val: 'private', icon: '🔒', title: 'Private', desc: 'Only the followers you confirm can see what you share.' },
                  { val: 'public', icon: '🔓', title: 'Public', desc: 'Anyone on or off NetoLynk can see what you share.' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setData(d => ({ ...d, privacy: opt.val as 'private' | 'public' }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 transition-all border ${
                      data.privacy === opt.val
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">{opt.icon}</div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">{opt.title}</p>
                      <p className="text-xs text-white/50">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-colors ${
                      data.privacy === opt.val ? 'border-blue-500 bg-blue-500' : 'border-white/30'
                    } flex items-center justify-center`}>
                      {data.privacy === opt.val && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
                <p className="text-white/30 text-xs mt-1">You can change this anytime in Settings.</p>
              </div>

              {/* Terms */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                <h3 className="font-bold text-white">Terms & Privacy</h3>
                {[
                  { title: '📋 Terms of Service', desc: 'Read our community guidelines and usage terms.' },
                  { title: '🔐 Privacy Policy', desc: 'Learn how we collect and use your data.' },
                  { title: '🍪 Cookie Policy', desc: 'Understand how we use cookies on NetoLynk.' },
                ].map(item => (
                  <button key={item.title} className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors text-left">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-white/40">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </button>
                ))}
              </div>

              <div className="flex-1" />
              <p className="text-white/30 text-xs text-center mb-4">
                By tapping "I Agree", you agree to NetoLynk's Terms of Service and Privacy Policy.
              </p>
              <button
                onClick={goNext}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-base transition-all"
              >
                I Agree
              </button>
            </div>
          )}

          {/* Step 4: Name */}
          {step === 4 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-5">
                  <User className="w-6 h-6 text-orange-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">What's your name?</h1>
                <p className="text-white/50">Add your name so friends can find you. You can always change this later.</p>
              </div>
              <div>
                <label className={labelClass}>Full name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                  className={inputClass}
                  placeholder="Your full name"
                  autoFocus
                />
              </div>
              <div className="flex-1" />
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 5: Username */}
          {step === 5 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-5">
                  <AtSign className="w-6 h-6 text-pink-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Create a username</h1>
                <p className="text-white/50">Pick a username for your new account. You can always change this later.</p>
              </div>
              <div>
                <label className={labelClass}>Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-base">@</span>
                  <input
                    type="text"
                    value={data.username}
                    onChange={e => setData(d => ({ ...d, username: e.target.value.replace(/\s/g, '').toLowerCase() }))}
                    className={inputClass + ' pl-8'}
                    placeholder="yourhandle"
                    autoFocus
                  />
                </div>
                {data.username && data.username.length >= 3 && (
                  <p className="text-green-400 text-xs mt-2 ml-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> @{data.username} looks good!
                  </p>
                )}
              </div>
              <div className="flex-1" />
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 6: Profile Picture */}
          {step === 6 && (
            <div className="flex-1 flex flex-col items-center">
              <div className="mb-8 text-center w-full">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-5 mx-auto">
                  <Camera className="w-6 h-6 text-yellow-400" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Add a profile photo</h1>
                <p className="text-white/50">Add a profile photo so your friends know it's you.</p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative w-36 h-36 rounded-full border-2 border-dashed border-white/20 hover:border-blue-500 transition-colors overflow-hidden group"
              >
                {data.profileImagePreview ? (
                  <img src={data.profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
                    <Camera className="w-10 h-10 text-white/30 mb-2" />
                    <span className="text-xs text-white/30">Tap to add</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />

              {data.profileImagePreview && (
                <p className="text-green-400 text-sm mt-4 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Photo selected
                </p>
              )}

              <div className="flex-1" />
              <div className="w-full space-y-3">
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account...</> : 'Add Photo & Continue'}
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full py-4 text-white/50 hover:text-white/80 font-medium transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Contacts sync (like Instagram screenshot 1) */}
          {step === 7 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-8">
                <div className="text-5xl mb-5">👥</div>
                <h1 className="text-3xl font-bold mb-4">Next, you can allow access to your contacts to make it easier to find your friends on NetoLynk</h1>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">🔄</span>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">Your contacts will be periodically synced and stored securely on our servers so we can help recommend people and things that are relevant to you.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">⚙️</span>
                    </div>
                    <p className="text-white/60 text-sm">You can turn off syncing at any time in <span className="text-blue-400">Settings. Learn more.</span></p>
                  </div>
                </div>
              </div>
              <div className="flex-1" />
              <p className="text-white/30 text-xs text-center mb-4">By tapping Next, you can choose to sync your contacts or skip this step.</p>
              <button
                onClick={goNext}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-base transition-all"
              >
                Next
              </button>
            </div>
          )}

          {/* Step 8: Follow suggestions (like Instagram screenshot 3) */}
          {step === 8 && (
            <div className="flex-1 flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">Follow 5 or more people</h1>
                <button onClick={goNext} className="text-white/50 hover:text-white text-sm">Skip</button>
              </div>
              <div className="relative mb-4">
                <input
                  type="text"
                  className="w-full px-4 py-3 pl-10 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 outline-none"
                  placeholder="Search"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                {SUGGESTED_ACCOUNTS.map(acc => (
                  <button
                    key={acc.username}
                    onClick={() => setFollowSelected(s => {
                      const n = new Set(s);
                      n.has(acc.username) ? n.delete(acc.username) : n.add(acc.username);
                      return n;
                    })}
                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-colors"
                  >
                    <img src={acc.avatar} alt={acc.displayName} className="w-12 h-12 rounded-full bg-white/10" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">{acc.displayName}</p>
                      <p className="text-white/40 text-xs">@{acc.username}</p>
                    </div>
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      followSelected.has(acc.username)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-white/30'
                    }`}>
                      {followSelected.has(acc.username) && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-white/30 text-xs text-center my-3">Following isn't required, but it's recommended for a personalized experience.</p>
              <button
                onClick={goNext}
                disabled={followSelected.size < 5}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-2xl font-bold text-base transition-all"
              >
                Follow ({followSelected.size} selected)
              </button>
            </div>
          )}

          {/* Step 9: All Set! */}
          {step === 9 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/30"
              >
                {data.profileImagePreview ? (
                  <img src={data.profileImagePreview} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Sparkles className="w-16 h-16 text-white" />
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-4xl font-bold mb-3">Welcome to<br />NetoLynk! 🎉</h1>
                <p className="text-white/50 mb-2">Hey <span className="text-white font-semibold">{data.name}</span>,</p>
                <p className="text-white/50 mb-1">Your account <span className="text-blue-400 font-semibold">@{data.username}</span> is ready.</p>
                <p className="text-white/40 text-sm mt-4 leading-relaxed max-w-xs mx-auto">
                  Start connecting with friends, share your moments, and explore what's happening around you.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12 w-full"
              >
                <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                  {[
                    { icon: '👥', label: 'Connect' },
                    { icon: '📸', label: 'Share' },
                    { icon: '🌟', label: 'Explore' },
                  ].map(item => (
                    <div key={item.label} className="bg-white/5 rounded-2xl p-4">
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <p className="text-sm font-medium text-white/70">{item.label}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl font-bold text-base transition-all shadow-lg shadow-blue-500/20"
                >
                  Start Exploring ✨
                </button>
              </motion.div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
