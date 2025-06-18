
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Post, CreatePostInput } from '../../../server/src/schema';

interface CreatePostProps {
  userId: string;
  onPostCreated: (post: Post) => void;
}

export function CreatePost({ userId, onPostCreated }: CreatePostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePostInput>({
    user_id: userId,
    content: '',
    code_snippet: null,
    code_language: null,
    image_urls: [],
    link_url: null,
    parent_post_id: null,
    repost_id: null,
    repost_comment: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;

    setIsLoading(true);
    try {
      const newPost = await trpc.createPost.mutate(formData);
      onPostCreated(newPost);
      
      // Reset form
      setFormData({
        user_id: userId,
        content: '',
        code_snippet: null,
        code_language: null,
        image_urls: [],
        link_url: null,
        parent_post_id: null,
        repost_id: null,
        repost_comment: null
      });
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const remainingChars = 280 - formData.content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <Textarea
          placeholder="What's happening in your dev world? 🚀"
          value={formData.content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreatePostInput) => ({ ...prev, content: e.target.value }))
          }
          onFocus={() => setIsExpanded(true)}
          className="min-h-[100px] resize-none border-gray-200 focus:border-gray-400 text-gray-900 placeholder-gray-500"
          maxLength={300} // Allow some overflow for user feedback
        />

        {isExpanded && (
          <div className="space-y-4">
            {/* Code Snippet Section */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (formData.code_snippet) {
                    setFormData((prev: CreatePostInput) => ({ 
                      ...prev, 
                      code_snippet: null, 
                      code_language: null 
                    }));
                  } else {
                    setFormData((prev: CreatePostInput) => ({ 
                      ...prev, 
                      code_snippet: '' 
                    }));
                  }
                }}
                className="text-sm"
              >
                <span className="mr-2">💻</span>
                {formData.code_snippet !== null ? 'Remove Code' : 'Add Code'}
              </Button>

              {formData.code_snippet !== null && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Select
                        value={formData.code_language || ''}
                        onValueChange={(value: string) =>
                          setFormData((prev: CreatePostInput)=> ({ 
                            ...prev, 
                            code_language: value || null 
                          }))
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="typescript">TypeScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="csharp">C#</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="go">Go</SelectItem>
                          <SelectItem value="rust">Rust</SelectItem>
                          <SelectItem value="php">PHP</SelectItem>
                          <SelectItem value="ruby">Ruby</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="css">CSS</SelectItem>
                          <SelectItem value="sql">SQL</SelectItem>
                          <SelectItem value="bash">Bash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Paste your code here..."
                      value={formData.code_snippet || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreatePostInput) => ({ 
                          ...prev, 
                          code_snippet: e.target.value 
                        }))
                      }
                      className="font-mono text-sm bg-white"
                      rows={6}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Link Section */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (formData.link_url) {
                    setFormData((prev: CreatePostInput) => ({ ...prev, link_url: null }));
                  } else {
                    setFormData((prev: CreatePostInput) => ({ ...prev, link_url: '' }));
                  }
                }}
                className="text-sm"
              >
                <span className="mr-2">🔗</span>
                {formData.link_url !== null ? 'Remove Link' : 'Add Link'}
              </Button>

              {formData.link_url !== null && (
                <Input
                  placeholder="https://example.com"
                  value={formData.link_url || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePostInput) => ({ 
                      ...prev, 
                      link_url: e.target.value || null 
                    }))
                  }
                  className="text-sm"
                />
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button type="button" variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <span className="mr-1">📷</span>
                  Image
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <span className="mr-1">📊</span>
                  Poll
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                  <span className="mr-1">😊</span>
                  Emoji
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <div className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
                  {remainingChars}
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.content.trim() || isOverLimit}
                  className="px-6"
                >
                  {isLoading ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isExpanded && formData.content && (
          <div className="flex justify-between items-center">
            <div className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {remainingChars}
            </div>
            <Button
              type="submit"
              disabled={isLoading || !formData.content.trim() || isOverLimit}
              size="sm"
            >
              {isLoading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
