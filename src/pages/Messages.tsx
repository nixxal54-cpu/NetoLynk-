import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollection } from '../hooks/useFirestore';
import { Chat, Message, User } from '../types';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Send, 
  Image as ImageIcon, 
  Loader2, 
  ChevronLeft,
  MoreVertical,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chats, loading: chatsLoading } = useCollection<Chat>('chats', [
    where('participants', 'array-contains', user?.uid || ''),
    orderBy('updatedAt', 'desc')
  ], [user?.uid]);

  const { data: messages, loading: messagesLoading } = useCollection<Message>(
    selectedChat ? `chats/${selectedChat.id}/messages` : 'null',
    [orderBy('createdAt', 'asc')],
    [selectedChat?.id]
  );

  // Handle incoming chat selection from profile
  useEffect(() => {
    if (location.state?.selectedChatId && chats.length > 0) {
      const chatToSelect = chats.find(c => c.id === location.state.selectedChatId);
      if (chatToSelect) {
        setSelectedChat(chatToSelect);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, chats]);

  useEffect(() => {
    if (selectedChat && user) {
      const partnerId = selectedChat.participants.find(p => p !== user.uid);
      if (partnerId) {
        if (selectedChat.participantDetails && selectedChat.participantDetails[partnerId]) {
          const details = selectedChat.participantDetails[partnerId];
          setChatPartner({
            id: partnerId,
            uid: partnerId,
            username: details.username,
            displayName: details.displayName,
            profileImage: details.profileImage
          } as User);
        } else {
          getDoc(doc(db, 'users', partnerId)).then(snap => {
            if (snap.exists()) setChatPartner(snap.data() as User);
          });
        }
      }
    } else {
      setChatPartner(null);
    }
  }, [selectedChat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
      toast.error("Image must be less than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      await sendMessage('', base64String);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl) || !selectedChat || !user) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, `chats/${selectedChat.id}/messages`), {
        chatId: selectedChat.id,
        senderId: user.uid,
        text: text.trim(),
        imageUrl: imageUrl || null,
        type: imageUrl ? 'image' : 'text',
        createdAt: new Date().toISOString(),
        serverCreatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: imageUrl ? 'Sent an image' : text.trim(),
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setMessageText('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(messageText);
  };

  return (
    <div className="flex-1 flex h-[100dvh] overflow-hidden border-x border-border pb-[68px] md:pb-0">
      {/* Chat List */}
      <div className={cn(
        "w-full md:w-80 border-r border-border flex flex-col bg-background",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        <header className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold">Messages</h2>
          <button className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <Plus className="w-5 h-5" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
          ) : chats.length > 0 ? (
            chats.map(chat => {
              const partnerId = chat.participants.find(p => p !== user?.uid);
              const details = chat.participantDetails?.[partnerId || ''];
              const displayName = details?.displayName || 'User';
              const profileImage = details?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${partnerId}`;

              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={cn(
                    "w-full p-4 flex gap-3 hover:bg-accent transition-colors text-left",
                    selectedChat?.id === chat.id && "bg-accent"
                  )}
                >
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex-shrink-0 overflow-hidden",
                      chat.id === chats[0]?.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                    )}>
                      <img src={profileImage} alt="Chat" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline">
                      <p className="font-bold truncate">{displayName}</p>
                      <span className="text-xs text-muted-foreground">
                        {chat.lastMessageAt && formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || 'No messages yet'}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">No conversations yet.</div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-background",
        !selectedChat ? "hidden md:flex items-center justify-center p-8 text-center" : "flex"
      )}>
        {!selectedChat ? (
          <div className="max-w-xs">
            <h3 className="text-2xl font-bold mb-2">Your Messages</h3>
            <p className="text-muted-foreground">Message a user to start a conversation or select an existing chat.</p>
          </div>
        ) : (
          <>
            <header className="p-4 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-[10px]">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChat(null)} className="md:hidden p-2 hover:bg-accent rounded-full">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${chatPartner?.username}`)}>
                  <img 
                    src={chatPartner?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatPartner?.username}`} 
                    className="w-10 h-10 rounded-full object-cover"
                    alt="Partner"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                </div>
                <div className="cursor-pointer" onClick={() => navigate(`/profile/${chatPartner?.username}`)}>
                  <p className="font-bold leading-tight hover:underline">{chatPartner?.displayName || 'Loading...'}</p>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </div>
              </div>
              <button className="p-2 hover:bg-accent rounded-full"><MoreVertical className="w-5 h-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {messagesLoading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : messages.map(msg => (
                <div 
                  key={msg.id}
                  className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-[15px]",
                    msg.senderId === user?.uid 
                      ? "bg-[#000000] border border-primary/30 text-foreground self-end rounded-tr-none" 
                      : "bg-[#1A1A1A] text-foreground self-start rounded-tl-none"
                  )}
                >
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Attachment" className="max-w-full rounded-xl mb-2" />
                  )}
                  {msg.text && <p>{msg.text}</p>}
                  <p className={cn(
                    "text-[10px] mt-1 opacity-70",
                    msg.senderId === user?.uid ? "text-right" : "text-left"
                  )}>
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex items-center gap-2 bg-background">
              <label className="p-2 text-primary hover:bg-primary/10 rounded-full opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
                <ImageIcon className="w-6 h-6" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Start a new message"
                className="flex-1 bg-accent border border-border rounded-full py-3 px-5 focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button 
                type="submit" 
                disabled={(!messageText.trim() && !isSending) || isSending}
                className="p-3 bg-primary text-primary-foreground rounded-full disabled:opacity-50 hover:opacity-90 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
