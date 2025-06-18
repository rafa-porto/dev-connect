
import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  display_name: z.string(),
  bio: z.string().nullable(),
  avatar_url: z.string().nullable(),
  banner_url: z.string().nullable(),
  location: z.string().nullable(),
  website: z.string().nullable(),
  github_url: z.string().nullable(),
  portfolio_url: z.string().nullable(),
  is_premium: z.boolean(),
  is_verified: z.boolean(),
  follower_count: z.number().int(),
  following_count: z.number().int(),
  post_count: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  display_name: z.string().min(1).max(100),
  bio: z.string().max(500).nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  website: z.string().nullable().optional(),
  github_url: z.string().nullable().optional(),
  portfolio_url: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.string(),
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  website: z.string().nullable().optional(),
  github_url: z.string().nullable().optional(),
  portfolio_url: z.string().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Post schemas
export const postSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  content: z.string(),
  code_snippet: z.string().nullable(),
  code_language: z.string().nullable(),
  image_urls: z.array(z.string()),
  link_url: z.string().nullable(),
  link_title: z.string().nullable(),
  link_description: z.string().nullable(),
  parent_post_id: z.string().nullable(),
  repost_id: z.string().nullable(),
  repost_comment: z.string().nullable(),
  like_count: z.number().int(),
  reply_count: z.number().int(),
  repost_count: z.number().int(),
  bookmark_count: z.number().int(),
  view_count: z.number().int(),
  is_pinned: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Post = z.infer<typeof postSchema>;

export const createPostInputSchema = z.object({
  user_id: z.string(),
  content: z.string().min(1).max(280),
  code_snippet: z.string().nullable().optional(),
  code_language: z.string().nullable().optional(),
  image_urls: z.array(z.string()).optional(),
  link_url: z.string().nullable().optional(),
  parent_post_id: z.string().nullable().optional(),
  repost_id: z.string().nullable().optional(),
  repost_comment: z.string().max(280).nullable().optional()
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;

// Skill schemas
export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  created_at: z.coerce.date()
});

export type Skill = z.infer<typeof skillSchema>;

export const userSkillSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  skill_id: z.string(),
  proficiency_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  years_experience: z.number().int().nullable(),
  created_at: z.coerce.date()
});

export type UserSkill = z.infer<typeof userSkillSchema>;

// Follow schemas
export const followSchema = z.object({
  id: z.string(),
  follower_id: z.string(),
  following_id: z.string(),
  created_at: z.coerce.date()
});

export type Follow = z.infer<typeof followSchema>;

export const createFollowInputSchema = z.object({
  follower_id: z.string(),
  following_id: z.string()
});

export type CreateFollowInput = z.infer<typeof createFollowInputSchema>;

// Like schemas
export const likeSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  post_id: z.string(),
  created_at: z.coerce.date()
});

export type Like = z.infer<typeof likeSchema>;

export const createLikeInputSchema = z.object({
  user_id: z.string(),
  post_id: z.string()
});

export type CreateLikeInput = z.infer<typeof createLikeInputSchema>;

// Bookmark schemas
export const bookmarkSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  post_id: z.string(),
  created_at: z.coerce.date()
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

export const createBookmarkInputSchema = z.object({
  user_id: z.string(),
  post_id: z.string()
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

// Direct message schemas
export const messageSchema = z.object({
  id: z.string(),
  sender_id: z.string(),
  recipient_id: z.string(),
  content: z.string(),
  file_url: z.string().nullable(),
  file_name: z.string().nullable(),
  file_type: z.string().nullable(),
  is_read: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Message = z.infer<typeof messageSchema>;

export const createMessageInputSchema = z.object({
  sender_id: z.string(),
  recipient_id: z.string(),
  content: z.string().min(1).max(1000),
  file_url: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
  file_type: z.string().nullable().optional()
});

export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;

// Project schemas
export const projectSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string(),
  tech_stack: z.array(z.string()),
  github_url: z.string().nullable(),
  live_url: z.string().nullable(),
  image_urls: z.array(z.string()),
  is_featured: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

export const createProjectInputSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  tech_stack: z.array(z.string()),
  github_url: z.string().nullable().optional(),
  live_url: z.string().nullable().optional(),
  image_urls: z.array(z.string()).optional()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

// Hashtag schemas
export const hashtagSchema = z.object({
  id: z.string(),
  name: z.string(),
  post_count: z.number().int(),
  trending_score: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Hashtag = z.infer<typeof hashtagSchema>;

// Notification schemas
export const notificationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  type: z.enum(['like', 'reply', 'follow', 'repost', 'mention', 'message']),
  actor_id: z.string(),
  post_id: z.string().nullable(),
  message: z.string(),
  is_read: z.boolean(),
  created_at: z.coerce.date()
});

export type Notification = z.infer<typeof notificationSchema>;

// Feed and search input schemas
export const getFeedInputSchema = z.object({
  user_id: z.string(),
  limit: z.number().int().min(1).max(50).optional(),
  offset: z.number().int().min(0).optional()
});

export type GetFeedInput = z.infer<typeof getFeedInputSchema>;

export const searchInputSchema = z.object({
  query: z.string().min(1),
  type: z.enum(['posts', 'users', 'hashtags']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  offset: z.number().int().min(0).optional()
});

export type SearchInput = z.infer<typeof searchInputSchema>;
