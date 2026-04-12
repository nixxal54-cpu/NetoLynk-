import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Post as PostType } from '../types';
import { PostCard } from '../components/Feed/PostCard';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userProfileImage: string;
  text: string;
  createdAt: string;
}

export const PostDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Listen to post
    const postRef = doc(db, 'posts', id);
    const unsubscribePost = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() } as PostType);
      } else {
        setPost(null);
      }
      setLoading(false);
    });

    // Listen to comments
    const commentsQuery = query(
      collection(db, 'posts', id, 'comments'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
    });

    return () => {
      unsubscribePost();
      unsubscribeComments();
    };
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !id) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'posts', id, 'comments'), {
        postId: id,
        userId: user.uid,
        username: user.username,
        userProfileImage: user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
        serverCreatedAt: serverTimestamp()
      });

      // Increment comment count on post
      await updateDoc(doc(db, 'posts', id), {
        commentsCount: increment(1)
      });

      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 p-8 text-center min-h-screen">
        <h2 className="text-2xl font-bold">Post not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-primary hover:underline">Go back home</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 max-w-2xl border-x border-border min-h-screen bg-background flex flex-col"
    >
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold">Post</h2>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <PostCard post={post} />

        <div className="border-t border-border">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 border-b border-border flex gap-3 hover:bg-accent/5 transition-colors">
              <img 
                src={comment.userProfileImage} 
                alt={comment.username} 
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold hover:underline cursor-pointer" onClick={() => navigate(`/profile/${comment.username}`)}>
                    {comment.username}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(comment.createdAt))}
                  </span>
                </div>
                <p className="mt-1 text-[15px]">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 md:relative border-t border-border bg-background p-4">
        <form onSubmit={handleAddComment} className="flex gap-3 items-center">
          <img 
            src={user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
            alt="You" 
            className="w-10 h-10 rounded-full object-cover hidden sm:block"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Post your reply..."
            className="flex-1 bg-accent/30 border border-border rounded-full px-4 py-3 outline-none focus:border-primary transition-colors text-base md:text-sm"
          />
          <button 
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="p-3 bg-primary text-primary-foreground rounded-full disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
