
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { User, Project } from '../../../server/src/schema';

interface ProfileSidebarProps {
  user: User;
}

export function ProfileSidebar({ user }: ProfileSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const userProjects = await trpc.getProjects.query(user.id);
      setProjects(userProjects.slice(0, 3)); // Show only first 3 projects
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 mb-3">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-gray-800 text-white text-lg">
                {user.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <h3 className="font-semibold text-gray-900">{user.display_name}</h3>
                {user.is_verified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    ✓
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">@{user.username}</p>
            </div>

            {user.bio && (
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                {user.bio}
              </p>
            )}

            {user.location && (
              <div className="flex items-center space-x-1 text-sm text-gray-500 mt-2">
                <span>📍</span>
                <span>{user.location}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">{user.post_count}</div>
              <div className="text-xs text-gray-600">Posts</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{user.following_count}</div>
              <div className="text-xs text-gray-600">Following</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{user.follower_count}</div>
              <div className="text-xs text-gray-600">Followers</div>
            </div>
          </div>

          {(user.website || user.github_url || user.portfolio_url) && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <span>🌐</span>
                    <span>Website</span>
                  </a>
                )}
                {user.github_url && (
                  <a
                    href={user.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <span>💻</span>
                    <span>GitHub</span>
                  </a>
                )}
                {user.portfolio_url && (
                  <a
                    href={user.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <span>🎨</span>
                    <span>Portfolio</span>
                  </a>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Featured Projects */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <span>🚀</span>
            <span>Featured Projects</span>
          </h3>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <p className="text-sm text-gray-500">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project: Project) => (
                <div key={project.id} className="space-y-1">
                  <h4 className="font-medium text-sm text-gray-900">{project.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{project.description}</p>
                  {project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.tech_stack.slice(0, 3).map((tech: string) => (
                        <Badge key={tech} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          {tech}
                        </Badge>
                      ))}
                      {project.tech_stack.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                          +{project.tech_stack.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {projects.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full text-xs text-gray-600 hover:text-gray-800">
                  View all projects
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
