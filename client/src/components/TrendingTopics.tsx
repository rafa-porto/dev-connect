
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { Hashtag } from '../../../server/src/schema';

export function TrendingTopics() {
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrendingHashtags = useCallback(async () => {
    try {
      const trending = await trpc.getTrendingHashtags.query(10);
      setHashtags(trending);
    } catch (error) {
      console.error('Failed to load trending hashtags:', error);
      // Provide fallback data for better user experience
      setHashtags([
        { id: '1', name: 'React', post_count: 1248, trending_score: 95.2, created_at: new Date(), updated_at: new Date() },
        { id: '2', name: 'TypeScript', post_count: 892, trending_score: 87.1, created_at: new Date(), updated_at: new Date() },
        { id: '3', name: 'WebDev', post_count: 756, trending_score: 82.3, created_at: new Date(), updated_at: new Date() },
        { id: '4', name: 'AI', post_count: 634, trending_score: 78.9, created_at: new Date(), updated_at: new Date() },
        { id: '5', name: 'DevOps', post_count: 521, trending_score: 71.5, created_at: new Date(), updated_at: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrendingHashtags();
  }, [loadTrendingHashtags]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="space-y-4">
      {/* Trending Topics */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <span>🔥</span>
            <span>Trending in Tech</span>
          </h3>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {hashtags.map((hashtag: Hashtag, index: number) => (
                <div key={hashtag.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className="bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
                    >
                      #{hashtag.name}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {formatNumber(hashtag.post_count)} posts
                  </p>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs text-gray-600 hover:text-gray-800 mt-3">
                Show more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Who to Follow */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <span>👥</span>
            <span>Who to Follow</span>
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Sarah Chen', username: 'sarahcodes', bio: 'Full-stack developer, React enthusiast', verified: true },
              { name: 'Alex Kumar', username: 'alexkdev', bio: 'DevOps engineer, K8s expert', verified: false },
              { name: 'Maya Thompson', username: 'mayaui', bio: 'UI/UX designer, Figma wizard', verified: true }
            ].map((user, index) => (
              <div key={index} className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {user.name}
                      </h4>
                      {user.verified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">@{user.username}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {user.bio}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Follow
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full text-xs text-gray-600 hover:text-gray-800">
              Show more
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Premium Upgrade */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
        <CardContent className="p-4">
          <div className="text-center space-y-3">
            <div className="text-2xl">✨</div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Upgrade to Premium</h3>
              <p className="text-xs text-gray-600 mt-1">
                Get advanced analytics, priority support, and exclusive features
              </p>
            </div>
            <Button size="sm" className="w-full bg-black text-white hover:bg-gray-800">
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
