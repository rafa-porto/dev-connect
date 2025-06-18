
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { SearchInput } from '../../../server/src/schema';

interface SearchPost {
  content: string;
  username: string;
  like_count: number;
}

interface SearchUser {
  display_name: string;
  username: string;
  follower_count: number;
}

interface SearchHashtag {
  name: string;
  post_count: number;
}

interface SearchResults {
  posts?: SearchPost[];
  users?: SearchUser[];
  hashtags?: SearchHashtag[];
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'posts' | 'users' | 'hashtags'>('posts');

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults({});
      return;
    }

    setIsLoading(true);
    try {
      const results = await trpc.searchContent.query({
        query: searchQuery,
        type: searchType,
        limit: 10
      } as SearchInput);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    if (value.length > 2) {
      const timeoutId = setTimeout(() => handleSearch(value), 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults({});
    }
  };

  const getCurrentResults = (): (SearchPost | SearchUser | SearchHashtag)[] => {
    switch (searchType) {
      case 'posts':
        return searchResults.posts || [];
      case 'users':
        return searchResults.users || [];
      case 'hashtags':
        return searchResults.hashtags || [];
      default:
        return [];
    }
  };

  const currentResults = getCurrentResults();

  return (
    <div className="relative">
      <div className="relative">
        <Input
          placeholder="Search DevConnect..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setTimeout(() => setIsExpanded(false), 200)}
          className="w-full pl-10 pr-4 bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-400"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>

      {isExpanded && (query.length > 0 || Object.keys(searchResults).length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-50">
          <CardContent className="p-4">
            {/* Search Type Tabs */}
            <div className="flex space-x-2 mb-4">
              {(['posts', 'users', 'hashtags'] as const).map((type) => (
                <Button
                  key={type}
                  variant={searchType === type ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSearchType(type);
                    if (query.length > 2) {
                      handleSearch(query);
                    }
                  }}
                  className="capitalize text-xs"
                >
                  {type}
                </Button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center text-gray-500 py-4">
                Searching...
              </div>
            ) : currentResults.length === 0 && query.length > 2 ? (
              <div className="text-center text-gray-500 py-4">
                No results found for "{query}"
              </div>
            ) : currentResults.length > 0 ? (
              <div className="space-y-3">
                {currentResults.map((result: SearchPost | SearchUser | SearchHashtag, index: number) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-50 rounded-md cursor-pointer border border-transparent hover:border-gray-200"
                  >
                    {searchType === 'posts' && 'content' in result && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {result.content || 'No content available'}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>By @{result.username || 'unknown'}</span>
                          <span>•</span>
                          <span>{result.like_count || 0} likes</span>
                        </div>
                      </div>
                    )}
                    
                    {searchType === 'users' && 'display_name' in result && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs">
                          {(result.display_name || result.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {result.display_name || result.username || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{result.username || 'unknown'} • {result.follower_count || 0} followers
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {searchType === 'hashtags' && 'name' in result && (
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-sm">
                          #{result.name || 'unknown'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {result.post_count || 0} posts
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : query.length <= 2 && query.length > 0 ? (
              <div className="text-center text-gray-500 py-4 text-sm">
                Type at least 3 characters to search
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
