import { useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const NETOLYNK_USER = {
  uid: 'system_netolynk_official',
  username: 'netolynk',
  displayName: 'NetoLynk Official',
  profileImage: 'https://api.dicebear.com/7.x/shapes/svg?seed=netolynk&backgroundColor=050505&shape1Color=FF3B30',
};

const DAILY_MESSAGES = [
  "Welcome to NetoLynk. Experience the ultimate fusion of a public social graph and private, secure messaging. Earn your connections.",
  "NetoLynk Architecture: High-density minimalism meets Obsidian-Crimson aesthetics. Designed for the professional.",
  "Security is paramount. Your direct messages are protected by our advanced relationship-tiered access logic.",
  "Explore the Vibes. Connect with others on the same frequency in our active Vibe Rooms.",
  "NetoLynk Version 2.0 is live. Faster, sleeker, and more secure than ever before."
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
        // Avoid composite index requirement by just getting the latest post
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
          // Create today's post
          const messageIndex = new Date().getDay() % DAILY_MESSAGES.length;
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
            recipientId: 'all', // Special ID for global notifications
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
