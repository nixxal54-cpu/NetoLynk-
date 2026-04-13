import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useFirestore';
import { where, orderBy } from 'firebase/firestore';
import { Bell, Loader2, Heart, MessageCircle, UserPlus, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderUsername: string;
  senderProfileImage: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  postId?: string;
  text?: string;
  read: boolean;
  createdAt: string;
}

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ No limit() — all notifications persist until user deletes them
  const { data: userNotifications, loading: userLoading } = useCollection<Notification>(
    'notifications',
    user
      ? [
          where('recipientId', '==', user.uid),
          orderBy('createdAt', 'desc'),
        ]
      : [],
    [user?.uid]
  );

  // ✅ No limit() on system notifications either
  const { data: systemNotifications, loading: systemLoading } = useCollection<Notification>(
    'notifications',
    [
      where('recipientId', '==', 'all'),
      orderBy('createdAt', 'desc'),
    ]
  );

  const loading = userLoading || systemLoading;

  const allNotifications = [...userNotifications, ...systemNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':    return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-primary" />;
      case 'follow':  return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'system':  return <Sparkles className="w-5 h-5 text-primary" />;
      default:        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    if (notification.type === 'system') return notification.text;
    switch (notification.type) {
      case 'like':    return 'liked your post.';
      case 'comment': return 'commented on your post.';
      case 'follow':  return 'started following you.';
      default:        return 'interacted with you.';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.postId) {
      navigate(`/post/${notification.postId}`);
    } else if (notification.senderUsername && notification.type !== 'system') {
      navigate(`/profile/${notification.senderUsername}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 max-w-2xl border-x border-border min-h-screen pb-20 md:pb-0 bg-background"
    >
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
      </header>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : allNotifications.length > 0 ? (
        <div className="divide-y divide-border">
          {allNotifications.map((notification) => (
            <div 
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className="p-4 hover:bg-accent/5 transition-colors cursor-pointer flex gap-4"
            >
              <div className="pt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <img 
                    src={notification.senderProfileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.senderUsername}`} 
                    alt={notification.senderUsername} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span
                    className="font-bold hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (notification.type !== 'system') navigate(`/profile/${notification.senderUsername}`);
                    }}
                  >
                    {notification.senderUsername}
                  </span>
                  {notification.type === 'system' && (
                    <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Official</span>
                  )}
                </div>
                <p className="text-[15px] text-foreground/90">
                  {notification.type === 'system' ? (
                    <span className="font-medium">{notification.text}</span>
                  ) : (
                    <span className="text-muted-foreground">{getNotificationText(notification)}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No notifications yet</p>
          <p>When someone interacts with you, you'll see it here.</p>
        </div>
      )}
    </motion.div>
  );
};
