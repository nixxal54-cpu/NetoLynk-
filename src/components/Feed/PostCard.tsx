import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Edit3,
  Angry,
  Leaf,
  Skull,
  Flame,
  Sparkles,
  Coffee,
  CloudRain,
  Rocket,
  Smile
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, arrayUnion, arrayRemove, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
}

export const getMoodIconByLabel = (label: string) => {
  switch (label) {
    case 'Frustrated': return <Angry className="w-4 h-4" />;
    case 'Peaceful': return <Leaf className="w-4 h-4" />;
    case 'Dead inside': return <Skull className="w-4 h-4" />;
    case 'Hyped': return <Flame className="w-4 h-4 text-orange-500" />;
    case 'Feeling cute': return <Sparkles className="w-4 h-4 text-yellow-500" />;
    case 'Need coffee': return <Coffee className="w-4 h-4 text-amber-700" />;
    case 'Crying': return <CloudRain className="w-4 h-4 text-blue-500" />;
    case 'Productive': return <Rocket className="w-4 h-4 text-purple-500" />;
    default: return <Smile className="w-4 h-4" />;
  }
};

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isLiked = user ? post.likedBy?.includes(user.uid) : false;
  const isSaved = user ? post.savedBy?.includes(user.uid) : false;
  const isOwnPost = user?.uid === post.userId;
  
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.text || '');

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isLiking) return;
    setIsLiking(true);

    try {
      const postRef = doc(db, 'posts', post.id);
      if (isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.uid),
          likesCount: increment(-1)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.uid),
          likesCount: increment(1)
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isSaving) return;
    setIsSaving(true);

    try {
      const postRef = doc(db, 'posts', post.id);
      if (isSaved) {
        await updateDoc(postRef, {
          savedBy: arrayRemove(user.uid)
        });
        toast.success("Removed from saved");
      } else {
        await updateDoc(postRef, {
          savedBy: arrayUnion(user.uid)
        });
        toast.success("Post saved");
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      toast.success("Link copied to clipboard!");
      
      await updateDoc(doc(db, 'posts', post.id), {
        sharesCount: increment(1)
      });
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, 'posts', post.id));
        toast.success("Post deleted");
      } catch (error) {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete post");
      }
    }
    setShowMenu(false);
  };

  const handleEditSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        text: editContent
      });
      toast.success("Post updated");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    }
  };

  return (
    <motion.article 
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
      onClick={() => !isEditing && navigate(`/post/${post.id}`)}
      className="border-b border-border p-4 hover:bg-accent/5 transition-all cursor-pointer relative"
    >
      <div className="flex gap-3">
        <img 
          src={post.userProfileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} 
          alt={post.username} 
          onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.username}`); }}
          className="w-12 h-12 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between relative gap-2">
            <div className="flex items-center flex-wrap gap-1 group min-w-0 flex-1">
              <span 
                className="font-bold hover:underline truncate max-w-[120px] sm:max-w-[200px] cursor-pointer"
                onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.username}`); }}
              >
                {post.username}
              </span>
              <span className="text-muted-foreground text-sm truncate max-w-[100px] sm:max-w-[150px]">@{post.username}</span>
              <span className="text-muted-foreground text-sm flex-shrink-0">·</span>
              <span className="text-muted-foreground text-sm hover:underline flex-shrink-0 whitespace-nowrap">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }).replace('about ', '')}
              </span>
            </div>
            
            {isOwnPost && (
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="text-muted-foreground hover:text-primary p-1 rounded-full hover:bg-primary/10 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                <AnimatePresence>
                  {showMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-8 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-accent transition-colors text-left"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Post</span>
                      </button>
                      <button 
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-destructive/10 text-destructive transition-colors text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Post</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {post.mood && (
            <div className="mt-1 inline-flex items-center gap-1.5 bg-accent/30 px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground border border-border/50">
              {getMoodIconByLabel(post.mood.label)}
              <span>Feeling {post.mood.label.toLowerCase()}</span>
            </div>
          )}

          {isEditing ? (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-accent/30 border border-border rounded-xl p-3 outline-none focus:border-primary resize-none min-h-[100px] text-base md:text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                  className="px-4 py-1.5 rounded-full font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditSubmit}
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-[15px] leading-normal whitespace-pre-wrap">
              {post.text}
            </div>
          )}

          {post.mediaUrls.length > 0 && (
            <div className={cn(
              "mt-3 rounded-2xl overflow-hidden border border-border grid gap-1",
              post.mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"
            )}>
              {post.mediaUrls.map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt="Post content" 
                  className="w-full h-full object-cover max-h-[512px]"
                />
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between max-w-md text-muted-foreground">
            <button 
              onClick={(e) => {
                e.preventDefault();
                handleLike(e);
              }}
              disabled={isLiking}
              className={cn(
                "flex items-center gap-2 group transition-colors cursor-pointer",
                isLiked ? "text-pink-500" : "hover:text-pink-500"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors pointer-events-none">
                <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
              </div>
              <span className="text-sm pointer-events-none">{post.likesCount || 0}</span>
            </button>

            <button 
              onClick={(e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                navigate(`/post/${post.id}`); 
              }}
              className="flex items-center gap-2 group hover:text-primary transition-colors cursor-pointer"
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors pointer-events-none">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm pointer-events-none">{post.commentsCount || 0}</span>
            </button>

            <button 
              onClick={(e) => {
                e.preventDefault();
                handleShare(e);
              }}
              className="flex items-center gap-2 group hover:text-green-500 transition-colors cursor-pointer"
            >
              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors pointer-events-none">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-sm pointer-events-none">{post.sharesCount || 0}</span>
            </button>

            <button 
              onClick={(e) => {
                e.preventDefault();
                handleSave(e);
              }}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-2 group transition-colors cursor-pointer",
                isSaved ? "text-primary" : "hover:text-primary"
              )}
            >
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors pointer-events-none">
                <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
