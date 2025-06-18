
import { useState, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Post, User } from '../../../server/src/schema';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const [author, setAuthor] = useState<User | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [isLoadingAuthor, setIsLoadingAuthor] = useState(true);

  // Load post author
  const loadAuthor = useCallback(async () => {
    try {
      const user = await trpc.getUser.query(post.user_id);
      setAuthor(user);
    } catch (error) {
      console.error('Failed to load post author:', error);
    } finally {
      setIsLoadingAuthor(false);
    }
  }, [post.user_id]);

  useState(() => {
    loadAuthor();
  });

  const handleLike = async () => {
    if (!currentUserId) return;
    
    try {
      if (isLiked) {
        await trpc.unlikePost.mutate({ userId: currentUserId, postId: post.id });
        setLikeCount((prev: number) => prev - 1);
      } else {
        await trpc.likePost.mutate({ user_id: currentUserId, post_id: post.id });
        setLikeCount((prev: number) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleBookmark = async () => {
    if (!currentUserId) return;
    
    try {
      if (isBookmarked) {
        await trpc.removeBookmark.mutate({ userId: currentUserId, postId: post.id });
      } else {
        await trpc.bookmarkPost.mutate({ user_id: currentUserId, post_id: post.id });
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString();
  };

  if (isLoadingAuthor) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author?.avatar_url || undefined} />
              <AvatarFallback className="bg-gray-800 text-white text-sm">
                {author?.display_name.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {author?.display_name || 'Unknown User'}
                </span>
                {author?.is_verified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    ✓ Verified
                  </Badge>
                )}
                {author?.is_premium && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                    ✨ Premium
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>@{author?.username || 'unknown'}</span>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
            <span className="text-lg">⋯</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Code Snippet */}
          {post.code_snippet && (
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-700">
                  {post.code_language || 'code'}
                </Badge>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 h-6 px-2">
                  Copy
                </Button>
              </div>
              <pre className="text-sm text-gray-100 font-mono">
                <code>{post.code_snippet}</code>
              </pre>
            </div>
          )}

          {/* Images */}
          {post.image_urls && post.image_urls.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg overflow-hidden">
              {post.image_urls.map((url: string, index: number) => (
                <img
                  key={index}
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-48 object-cover bg-gray-100"
                />
              ))}
            </div>
          )}

          {/* Link Preview */}
          {post.link_url && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="space-y-1">
                {post.link_title && (
                  <h4 className="font-medium text-gray-900 text-sm">{post.link_title}</h4>
                )}
                {post.link_description && (
                  <p className="text-gray-600 text-sm">{post.link_description}</p>
                )}
                <a
                  href={post.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  {post.link_url}
                </a>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-1 text-sm ${
                isLiked ? 'text-red-600 hover:text-red-700' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className={isLiked ? '❤️' : '🤍'}></span>
              <span>{likeCount}</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800">
              <span>💬</span>
              <span>{post.reply_count}</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800">
              <span>🔄</span>
              <span>{post.repost_count}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={`text-sm ${
                isBookmarked ? 'text-amber-600 hover:text-amber-700' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span>{isBookmarked ? '🔖' : '📎'}</span>
            </Button>

            <Button variant="ghost" size="sm" className="text-sm text-gray-600 hover:text-gray-800">
              <span>📤</span>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
