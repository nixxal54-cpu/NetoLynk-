import { useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const NETOLYNK_USER = {
  uid: 'system_netolynk_official',
  username: 'netolynk',
  displayName: 'NetoLynk Official',
  profileImage: '/netolynk-logo.png',
};

const DAILY_MESSAGES = [
  // Platform & Vision
  "Welcome to NetoLynk. Experience the ultimate fusion of a public social graph and private, secure messaging. Earn your connections.",
  "NetoLynk Architecture: High-density minimalism meets Obsidian-Crimson aesthetics. Designed for the professional.",
  "Security is paramount. Your direct messages are protected by our advanced relationship-tiered access logic.",
  "Explore the Vibes. Connect with others on the same frequency in our active Vibe Rooms.",
  "NetoLynk Version 2.0 is live. Faster, sleeker, and more secure than ever before.",
  "NetoLynk is not just a platform. It's a philosophy. Build your network with intention.",
  "Every connection on NetoLynk is earned, not given. Quality over quantity — always.",
  "The future of social is private by design and public by choice. That's the NetoLynk way.",
  "NetoLynk was built for those who take their digital presence seriously.",
  "Your feed. Your rules. Your network. Welcome to NetoLynk.",
  "We built NetoLynk for the creators, the thinkers, the builders, and the visionaries.",
  "NetoLynk doesn't track you. It empowers you.",
  "On NetoLynk, your data belongs to you. Always.",
  "A platform built on trust. A network built on merit. Welcome home.",
  "NetoLynk is where real conversations happen between real people.",

  // Features & Product
  "Did you know? NetoLynk's Vibe Rooms are live spaces where your energy meets others in real time.",
  "Post. Connect. Vibe. The NetoLynk experience was designed to be seamless from day one.",
  "NetoLynk's dark-first design isn't just aesthetic — it's intentional. Easy on the eyes, heavy on impact.",
  "Explore the For You feed and discover content curated precisely to your interests.",
  "The Following tab keeps your closest connections front and center. Never miss a moment.",
  "Our Vibes tab is a mood-based discovery engine. Find your frequency.",
  "NetoLynk supports rich media posts. Share your world in full detail.",
  "Bookmark content that matters. Your saves are private and always accessible.",
  "Notifications on NetoLynk are smart — you only hear what truly matters.",
  "The NetoLynk explore page is your window to the world. Dive in.",
  "Create a post in seconds. Express yourself without friction.",
  "Your profile on NetoLynk is your identity. Make it count.",
  "NetoLynk's messaging system is built for depth, not noise.",
  "Switch between accounts seamlessly. NetoLynk supports multi-account access.",
  "Activity tracking on NetoLynk keeps you in control of your digital footprint.",

  // Motivation & Mindset
  "The best networks are built one genuine connection at a time.",
  "Don't just post. Communicate. Don't just follow. Connect.",
  "Your voice matters. NetoLynk gives it the stage it deserves.",
  "Great things happen when authentic people find each other. That's NetoLynk.",
  "Be the kind of connection you wish you had.",
  "Show up. Speak up. Stand out. NetoLynk is your arena.",
  "Authenticity is the rarest currency online. Spend it wisely here.",
  "Your network is your net worth. Build it with care on NetoLynk.",
  "Silence is loud on NetoLynk. Post something that echoes.",
  "A single post can spark a global conversation. Yours could be next.",
  "Stop scrolling. Start creating. The world needs your perspective.",
  "The most powerful thing you can do online is be genuinely yourself.",
  "Your story isn't finished. Keep writing it here on NetoLynk.",
  "Consistency on social media compounds like interest. Show up daily.",
  "Connections built on shared values last longer than those built on trends.",
  "Don't wait for the perfect moment. Post, connect, and refine as you grow.",
  "Small actions on NetoLynk create massive ripples in your network.",
  "The courage to share your thoughts is the first step to being heard.",
  "Every great creator started with zero followers. Keep going.",
  "Your feed reflects your focus. Curate it intentionally.",

  // Tech & Innovation
  "NetoLynk is engineered for performance. Every millisecond matters.",
  "We obsess over load times so you can obsess over your content.",
  "Real-time updates. Zero lag. That's the NetoLynk standard.",
  "Our infrastructure scales with your ambition. No limits, no compromises.",
  "NetoLynk is mobile-first because that's where life happens.",
  "Progressive Web App technology means NetoLynk works even when the signal doesn't.",
  "We use Firebase's real-time database so your experience is always live.",
  "NetoLynk's codebase is built for longevity and constant evolution.",
  "Every update to NetoLynk is driven by user feedback and engineering excellence.",
  "We ship improvements daily. NetoLynk is always getting better.",
  "Dark mode isn't a feature on NetoLynk. It's the default. Because we know you.",
  "NetoLynk's backend is battle-tested to handle millions of interactions.",
  "Security patches, performance boosts, new features — the pipeline never stops.",
  "Our team ships with intention. Every feature exists for a reason.",
  "NetoLynk is lightweight by design. Fast for everyone, everywhere.",

  // Community & Culture
  "The NetoLynk community is made of people who refuse to be average.",
  "Respect is the foundation of every great community. Hold the standard here.",
  "NetoLynk is a judgment-free zone for ideas. Bring your boldest thoughts.",
  "We celebrate originality here. There's room for every authentic voice.",
  "The culture on NetoLynk is set by its users. Make it something worth being part of.",
  "Lift others as you rise. Collaboration beats competition every time.",
  "NetoLynk thrives when its community does. We're in this together.",
  "Introduce yourself to someone new today. Your next great connection is one post away.",
  "The NetoLynk family grows stronger with every new member. Welcome.",
  "Real communities support each other. Be that for someone today.",
  "Leave the comment. Share the post. Send the message. Connection starts with you.",
  "Your engagement on NetoLynk directly grows someone else's confidence. Use that power.",
  "Healthy discourse builds stronger networks. Debate ideas, not people.",
  "The most followed accounts on NetoLynk are the most consistent. Start now.",
  "A rising tide lifts all ships. Support your fellow NetoLynk creators.",

  // Inspiration & Wisdom
  "The internet is full of noise. NetoLynk is built for signal.",
  "Ideas shared are ideas amplified. Don't keep yours locked away.",
  "You don't need a million followers to make a million-dollar impact.",
  "The best time to build your network was yesterday. The second best time is now.",
  "Quality content will always outlast viral trends.",
  "Be the voice you wish existed when you were starting out.",
  "Your expertise is someone else's breakthrough. Share it freely.",
  "People don't remember what you posted. They remember how you made them feel.",
  "Discipline in content creation is the difference between growth and stagnation.",
  "Every follower was once a stranger who resonated with your words.",
  "The platforms change. Authentic storytelling never goes out of style.",
  "Write like someone needs to hear it. Because someone always does.",
  "Your niche is not a limitation. It's your superpower.",
  "In a world of highlights, vulnerability is refreshing. Be real here.",
  "Dreams shared publicly become goals. Goals with community become achievements.",

  // Growth & Strategy
  "Engage before you post. The algorithm rewards those who give before they take.",
  "Consistency is the cheat code for social media growth. Show up every day.",
const DAILY_MESSAGES = [
  // --- Existing Platform & Vision ---
  "Welcome to NetoLynk. Experience the ultimate fusion of a public social graph and private, secure messaging. Earn your connections.",
  "NetoLynk Architecture: High-density minimalism meets Obsidian-Crimson aesthetics. Designed for the professional.",
  "Security is paramount. Your direct messages are protected by our advanced relationship-tiered access logic.",
  "Explore the Vibes. Connect with others on the same frequency in our active Vibe Rooms.",
  "NetoLynk Version 2.0 is live. Faster, sleeker, and more secure than ever before.",
  "NetoLynk is not just a platform. It's a philosophy. Build your network with intention.",
  "Every connection on NetoLynk is earned, not given. Quality over quantity — always.",
  "The future of social is private by design and public by choice. That's the NetoLynk way.",
  "NetoLynk was built for those who take their digital presence seriously.",
  "Your feed. Your rules. Your network. Welcome to NetoLynk.",
  "We built NetoLynk for the creators, the thinkers, the builders, and the visionaries.",
  "NetoLynk doesn't track you. It empowers you.",
  "On NetoLynk, your data belongs to you. Always.",
  "A platform built on trust. A network built on merit. Welcome home.",
  "NetoLynk is where real conversations happen between real people.",
  
  // --- NEW: Platform & Vision ---
  "NetoLynk is the bridge between who you are and who you are becoming. Cross it daily.",
  "Your digital presence is an asset. Manage it like a portfolio on NetoLynk.",
  "We removed the noise so you can focus on the signal. Welcome to the new standard.",
  "Design dictates behavior. Our Obsidian-Crimson interface is built to trigger deep focus.",
  "Privacy is not an afterthought. It is the bedrock of the NetoLynk architecture.",

  // --- Existing Features & Product ---
  "Did you know? NetoLynk's Vibe Rooms are live spaces where your energy meets others in real time.",
  "Post. Connect. Vibe. The NetoLynk experience was designed to be seamless from day one.",
  "NetoLynk's dark-first design isn't just aesthetic — it's intentional. Easy on the eyes, heavy on impact.",
  "Explore the For You feed and discover content curated precisely to your interests.",
  "The Following tab keeps your closest connections front and center. Never miss a moment.",
  "Our Vibes tab is a mood-based discovery engine. Find your frequency.",
  "NetoLynk supports rich media posts. Share your world in full detail.",
  "Bookmark content that matters. Your saves are private and always accessible.",
  "Notifications on NetoLynk are smart — you only hear what truly matters.",
  "The NetoLynk explore page is your window to the world. Dive in.",
  "Create a post in seconds. Express yourself without friction.",
  "Your profile on NetoLynk is your identity. Make it count.",
  "NetoLynk's messaging system is built for depth, not noise.",
  "Switch between accounts seamlessly. NetoLynk supports multi-account access.",
  "Activity tracking on NetoLynk keeps you in control of your digital footprint.",

  // --- NEW: Features & Product ---
  "Tailor your digital environment. NetoLynk’s architecture adapts to your professional needs.",
  "Drop into a Vibe Room to sync with minds operating on your exact frequency.",
  "Direct Messaging on NetoLynk is a privilege. Earn the right to enter the inbox.",
  "Save what inspires you. Your NetoLynk bookmarks are a private vault of genius.",
  "No shadowbanning. No algorithmic suppression. Just pure, chronological connection.",

  // --- Existing Motivation & Mindset ---
  "The best networks are built one genuine connection at a time.",
  "Don't just post. Communicate. Don't just follow. Connect.",
  "Your voice matters. NetoLynk gives it the stage it deserves.",
  "Great things happen when authentic people find each other. That's NetoLynk.",
  "Be the kind of connection you wish you had.",
  "Show up. Speak up. Stand out. NetoLynk is your arena.",
  "Authenticity is the rarest currency online. Spend it wisely here.",
  "Your network is your net worth. Build it with care on NetoLynk.",
  "Silence is loud on NetoLynk. Post something that echoes.",
  "A single post can spark a global conversation. Yours could be next.",
  "Stop scrolling. Start creating. The world needs your perspective.",
  "The most powerful thing you can do online is be genuinely yourself.",
  "Your story isn't finished. Keep writing it here on NetoLynk.",
  "Consistency on social media compounds like interest. Show up daily.",
  "Connections built on shared values last longer than those built on trends.",
  "Don't wait for the perfect moment. Post, connect, and refine as you grow.",
  "Small actions on NetoLynk create massive ripples in your network.",
  "The courage to share your thoughts is the first step to being heard.",
  "Every great creator started with zero followers. Keep going.",
  "Your feed reflects your focus. Curate it intentionally.",

  // --- NEW: Motivation & Mindset ---
  "Brilliance thrives in focused environments. Protect your attention.",
  "Every interaction is a digital handshake. Make it firm.",
  "Don't compete for attention. Command it through undeniable value.",
  "A quiet professional speaks volumes when they finally take the stage. Own your voice.",
  "Your daily habits dictate your lifelong outcomes. Cultivate a high-value network.",

  // --- Existing Tech & Innovation ---
  "NetoLynk is engineered for performance. Every millisecond matters.",
  "We obsess over load times so you can obsess over your content.",
  "Real-time updates. Zero lag. That's the NetoLynk standard.",
  "Our infrastructure scales with your ambition. No limits, no compromises.",
  "NetoLynk is mobile-first because that's where life happens.",
  "Progressive Web App technology means NetoLynk works even when the signal doesn't.",
  "We use Firebase's real-time database so your experience is always live.",
  "NetoLynk's codebase is built for longevity and constant evolution.",
  "Every update to NetoLynk is driven by user feedback and engineering excellence.",
  "We ship improvements daily. NetoLynk is always getting better.",
  "Dark mode isn't a feature on NetoLynk. It's the default. Because we know you.",
  "NetoLynk's backend is battle-tested to handle millions of interactions.",
  "Security patches, performance boosts, new features — the pipeline never stops.",
  "Our team ships with intention. Every feature exists for a reason.",
  "NetoLynk is lightweight by design. Fast for everyone, everywhere.",

  // --- NEW: Tech & Innovation ---
  "Built on modern frameworks, designed for future-proof scalability.",
  "NetoLynk's data architecture ensures your insights remain strictly yours.",
  "Sub-second latency. Because your ideas shouldn't have to wait to be seen.",
  "We refine the NetoLynk codebase like a master craftsman. Precision in every line.",
  "Security is not a feature; it's a prerequisite. Your data is encrypted and secure.",

  // --- Existing Community & Culture ---
  "The NetoLynk community is made of people who refuse to be average.",
  "Respect is the foundation of every great community. Hold the standard here.",
  "NetoLynk is a judgment-free zone for ideas. Bring your boldest thoughts.",
  "We celebrate originality here. There's room for every authentic voice.",
  "The culture on NetoLynk is set by its users. Make it something worth being part of.",
  "Lift others as you rise. Collaboration beats competition every time.",
  "NetoLynk thrives when its community does. We're in this together.",
  "Introduce yourself to someone new today. Your next great connection is one post away.",
  "The NetoLynk family grows stronger with every new member. Welcome.",
  "Real communities support each other. Be that for someone today.",
  "Leave the comment. Share the post. Send the message. Connection starts with you.",
  "Your engagement on NetoLynk directly grows someone else's confidence. Use that power.",
  "Healthy discourse builds stronger networks. Debate ideas, not people.",
  "The most followed accounts on NetoLynk are the most consistent. Start now.",
  "A rising tide lifts all ships. Support your fellow NetoLynk creators.",

  // --- NEW: Community & Culture ---
  "NetoLynk is a meritocracy. The best ideas rise, regardless of follower count.",
  "Surround yourself with people who force you to level up.",
  "Dissent is welcome. Disrespect is not. Elevate the conversation.",
  "A network is only as valuable as the trust between its nodes. Build trust today.",
  "We don't just share links here; we share frameworks, mental models, and breakthroughs.",

  // --- Existing Inspiration & Wisdom ---
  "The internet is full of noise. NetoLynk is built for signal.",
  "Ideas shared are ideas amplified. Don't keep yours locked away.",
  "You don't need a million followers to make a million-dollar impact.",
  "The best time to build your network was yesterday. The second best time is now.",
  "Quality content will always outlast viral trends.",
  "Be the voice you wish existed when you were starting out.",
  "Your expertise is someone else's breakthrough. Share it freely.",
  "People don't remember what you posted. They remember how you made them feel.",
  "Discipline in content creation is the difference between growth and stagnation.",
  "Every follower was once a stranger who resonated with your words.",
  "The platforms change. Authentic storytelling never goes out of style.",
  "Write like someone needs to hear it. Because someone always does.",
  "Your niche is not a limitation. It's your superpower.",
  "In a world of highlights, vulnerability is refreshing. Be real here.",
  "Dreams shared publicly become goals. Goals with community become achievements.",

  // --- NEW: Inspiration & Wisdom ---
  "The most valuable currency in the modern economy is focused attention.",
  "Don't build an audience. Build an empire of allies.",
  "Read more than you write. Listen more than you speak. Post when it matters.",
  "True influence isn't measured by metrics, but by the actions your words inspire.",
  "Mastery is a lonely road, but you don't have to walk it completely alone. Connect.",

  // --- Existing Growth & Strategy ---
  "Engage before you post. The algorithm rewards those who give before they take.",
  "Consistency is the cheat code for social media growth. Show up every day.",
  "Reply to every comment in your early days. That loyalty compounds.",
  "Your bio is your first impression. Make it unforgettable.",
  "Cross-pollinate your ideas. The best content lives at the intersection of fields.",
  "Repurpose your best ideas. Not everyone saw it the first time.",
  "Study what resonates, then create more of it. Data-driven creativity wins.",
  "Collaboration with other creators accelerates both your growth curves.",
  "Post at the intersection of what you love and what others need.",
  "A clear message travels further than a clever one. Clarity wins.",
  "The hook matters more than the post. Master your opening line.",
  "NetoLynk rewards those who add value consistently over those who post randomly.",
  "Your followers follow you for you. Don't dilute that by chasing trends blindly.",
  "Build in public. Let people watch your journey. Transparency builds trust.",
  "Take feedback seriously. Your community will tell you exactly what they need.",

  // --- NEW: Growth & Strategy ---
  "Before you ask for a favor, provide a solution. That is the NetoLynk way.",
  "Document your process. The finished product is inspiring, but the journey is educational.",
  "Curate your feed ruthlessly. You are the product of the information you consume.",
  "Long-form thinking wins in a short-form world. Take your time to articulate.",
  "Treat your NetoLynk profile like an active resume. What did you accomplish today?",

  // --- Existing Daily Affirmations for the Network ---
  "Today is a great day to make a meaningful connection on NetoLynk.",
  "One post today could change your trajectory tomorrow.",
  "The version of you that shows up today is enough. Post anyway.",
  "Growth happens in the moments you choose to engage instead of scroll.",
  "Make today's post count. Someone out there needs exactly what you have to say.",
  "You are one conversation away from your next opportunity.",
  "Log in. Look around. Leave something valuable behind.",
  "Progress over perfection. Post the imperfect draft. Refine as you go.",
  "Your next follower is already searching for what only you can provide.",
  "Today's engagement is tomorrow's algorithm advantage. Show up now.",
  
  // --- NEW: Daily Affirmations for the Network ---
  "Today is an opportunity to learn something that challenges your baseline.",
  "Step into the arena. Your perspective is the missing piece to someone's puzzle.",
  "Focus on the work. Let your NetoLynk connections amplify the results.",
  "You have the capacity to build something remarkable today.",
  "Command your day. Start by commanding your network."
];


export const useNetolynkSystem = () => {
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (!firebaseUser) return;

    const runSystemCheck = async () => {
      try {
        // Check if we already posted today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const postsRef = collection(db, 'posts');
        const q = query(
          postsRef, 
          where('userId', '==', NETOLYNK_USER.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        let postedToday = false;

        if (!snapshot.empty) {
          const latestPost = snapshot.docs[0].data();
          if (latestPost.createdAt >= today.toISOString()) {
            postedToday = true;
          }
        }
        
        if (!postedToday) {
          // Get total posts count to determine index — loops automatically via modulo
          const allPostsQ = query(
            postsRef,
            where('userId', '==', NETOLYNK_USER.uid),
            orderBy('createdAt', 'asc')
          );
          const allPostsSnap = await getDocs(allPostsQ);
          const totalPosted = allPostsSnap.size;

          // Loop back to start when all messages exhausted
          const messageIndex = totalPosted % DAILY_MESSAGES.length;
          const message = DAILY_MESSAGES[messageIndex];
          
          const postDoc = await addDoc(collection(db, 'posts'), {
            userId: NETOLYNK_USER.uid,
            username: NETOLYNK_USER.username,
            userProfileImage: NETOLYNK_USER.profileImage,
            text: message,
            mediaUrls: [],
            type: 'text',
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            createdAt: new Date().toISOString(),
            serverCreatedAt: serverTimestamp(),
            isOfficial: true
          });

          // Create a global notification
          await addDoc(collection(db, 'notifications'), {
            recipientId: 'all',
            senderId: NETOLYNK_USER.uid,
            senderUsername: NETOLYNK_USER.username,
            senderProfileImage: NETOLYNK_USER.profileImage,
            type: 'system',
            postId: postDoc.id,
            text: message,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error("NetoLynk System Error:", error);
      }
    };

    runSystemCheck();
  }, [firebaseUser]);
};
