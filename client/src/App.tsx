
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/utils/trpc';
import type { Post, User } from '../../server/src/schema';
import { PostCard } from '@/components/PostCard';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { CreatePost } from '@/components/CreatePost';
import { SearchBar } from '@/components/SearchBar';
import { TrendingTopics } from '@/components/TrendingTopics';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');

  // Current user ID - in a real app this would come from auth context
  const currentUserId = 'user-1';

  const loadPosts = useCallback(async () => {
    try {
      const result = await trpc.getPosts.query();
      setPosts(result);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const user = await trpc.getUser.query(currentUserId);
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  }, [currentUserId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadPosts(), loadCurrentUser()]);
      setIsLoading(false);
    };
    loadData();
  }, [loadPosts, loadCurrentUser]);

  const handlePostCreated = useCallback((newPost: Post) => {
    setPosts((prev: Post[]) => [newPost, ...prev]);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading DevConnect...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-black">DevConnect</h1>
              <nav className="hidden md:flex space-x-6">
                <Button
                  variant={activeTab === 'feed' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('feed')}
                  className="text-sm"
                >
                  Feed
                </Button>
                <Button
                  variant={activeTab === 'discover' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('discover')}
                  className="text-sm"
                >
                  Discover
                </Button>
                <Button
                  variant={activeTab === 'messages' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('messages')}
                  className="text-sm"
                >
                  Messages
                </Button>
              </nav>
            </div>
            
            <div className="flex-1 max-w-lg mx-8">
              <SearchBar />
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <span className="mr-2">✨</span>
                Premium
              </Button>
              {currentUser && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-gray-800 text-white text-xs">
                    {currentUser.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Profile */}
          <div className="lg:col-span-1">
            {currentUser && <ProfileSidebar user={currentUser} />}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'feed' && (
              <>
                {/* Create Post */}
                {currentUser && (
                  <Card className="bg-white border border-gray-200">
                    <CardContent className="p-4">
                      <CreatePost 
                        userId={currentUser.id} 
                        onPostCreated={handlePostCreated}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Posts Feed */}
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <Card className="bg-white border border-gray-200">
                      <CardContent className="p-8 text-center">
                        <div className="text-gray-500">
                          <p className="text-lg font-medium mb-2">Welcome to DevConnect! 👋</p>
                          <p>Start by creating your first post or following other developers.</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    posts.map((post: Post) => (
                      <PostCard 
                        key={post.id} 
                        post={post} 
                        currentUserId={currentUser?.id}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === 'discover' && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-black">Discover</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Explore trending topics, popular developers, and featured projects.</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Featured Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {['React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Rust'].map((skill) => (
                          <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'messages' && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-black">Messages</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Your direct messages will appear here.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Trending */}
          <div className="lg:col-span-1">
            <TrendingTopics />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
