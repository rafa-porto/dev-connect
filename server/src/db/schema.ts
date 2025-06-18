
import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  integer,
  jsonb,
  pgEnum,
  real,
  index
} from 'drizzle-orm/pg-core';

// Enums
export const proficiencyLevelEnum = pgEnum('proficiency_level', ['beginner', 'intermediate', 'advanced', 'expert']);
export const notificationTypeEnum = pgEnum('notification_type', ['like', 'reply', 'follow', 'repost', 'mention', 'message']);

// Users table
export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  display_name: text('display_name').notNull(),
  bio: text('bio'),
  avatar_url: text('avatar_url'),
  banner_url: text('banner_url'),
  location: text('location'),
  website: text('website'),
  github_url: text('github_url'),
  portfolio_url: text('portfolio_url'),
  is_premium: boolean('is_premium').notNull().default(false),
  is_verified: boolean('is_verified').notNull().default(false),
  follower_count: integer('follower_count').notNull().default(0),
  following_count: integer('following_count').notNull().default(0),
  post_count: integer('post_count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  usernameIdx: index('username_idx').on(table.username),
  emailIdx: index('email_idx').on(table.email)
}));

// Posts table - fix circular reference by removing self-references from the column definition
export const postsTable = pgTable('posts', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  code_snippet: text('code_snippet'),
  code_language: text('code_language'),
  image_urls: jsonb('image_urls').notNull().default([]),
  link_url: text('link_url'),
  link_title: text('link_title'),
  link_description: text('link_description'),
  parent_post_id: text('parent_post_id'),
  repost_id: text('repost_id'),
  repost_comment: text('repost_comment'),
  like_count: integer('like_count').notNull().default(0),
  reply_count: integer('reply_count').notNull().default(0),
  repost_count: integer('repost_count').notNull().default(0),
  bookmark_count: integer('bookmark_count').notNull().default(0),
  view_count: integer('view_count').notNull().default(0),
  is_pinned: boolean('is_pinned').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('posts_user_id_idx').on(table.user_id),
  createdAtIdx: index('posts_created_at_idx').on(table.created_at),
  parentPostIdIdx: index('posts_parent_post_id_idx').on(table.parent_post_id),
  repostIdIdx: index('posts_repost_id_idx').on(table.repost_id)
}));

// Skills table
export const skillsTable = pgTable('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  nameIdx: index('skills_name_idx').on(table.name),
  categoryIdx: index('skills_category_idx').on(table.category)
}));

// User skills table
export const userSkillsTable = pgTable('user_skills', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  skill_id: text('skill_id').notNull().references(() => skillsTable.id, { onDelete: 'cascade' }),
  proficiency_level: proficiencyLevelEnum('proficiency_level').notNull(),
  years_experience: integer('years_experience'),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('user_skills_user_id_idx').on(table.user_id),
  skillIdIdx: index('user_skills_skill_id_idx').on(table.skill_id)
}));

// Follows table
export const followsTable = pgTable('follows', {
  id: text('id').primaryKey(),
  follower_id: text('follower_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  following_id: text('following_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  followerIdIdx: index('follows_follower_id_idx').on(table.follower_id),
  followingIdIdx: index('follows_following_id_idx').on(table.following_id),
  uniqueFollowIdx: index('follows_unique_idx').on(table.follower_id, table.following_id)
}));

// Likes table
export const likesTable = pgTable('likes', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  post_id: text('post_id').notNull().references(() => postsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('likes_user_id_idx').on(table.user_id),
  postIdIdx: index('likes_post_id_idx').on(table.post_id),
  uniqueLikeIdx: index('likes_unique_idx').on(table.user_id, table.post_id)
}));

// Bookmarks table
export const bookmarksTable = pgTable('bookmarks', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  post_id: text('post_id').notNull().references(() => postsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('bookmarks_user_id_idx').on(table.user_id),
  postIdIdx: index('bookmarks_post_id_idx').on(table.post_id),
  uniqueBookmarkIdx: index('bookmarks_unique_idx').on(table.user_id, table.post_id)
}));

// Messages table
export const messagesTable = pgTable('messages', {
  id: text('id').primaryKey(),
  sender_id: text('sender_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  recipient_id: text('recipient_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  file_url: text('file_url'),
  file_name: text('file_name'),
  file_type: text('file_type'),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  senderIdIdx: index('messages_sender_id_idx').on(table.sender_id),
  recipientIdIdx: index('messages_recipient_id_idx').on(table.recipient_id),
  createdAtIdx: index('messages_created_at_idx').on(table.created_at)
}));

// Projects table
export const projectsTable = pgTable('projects', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  tech_stack: jsonb('tech_stack').notNull().default([]),
  github_url: text('github_url'),
  live_url: text('live_url'),
  image_urls: jsonb('image_urls').notNull().default([]),
  is_featured: boolean('is_featured').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('projects_user_id_idx').on(table.user_id),
  isFeaturedIdx: index('projects_is_featured_idx').on(table.is_featured)
}));

// Hashtags table
export const hashtagsTable = pgTable('hashtags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  post_count: integer('post_count').notNull().default(0),
  trending_score: real('trending_score').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  nameIdx: index('hashtags_name_idx').on(table.name),
  trendingScoreIdx: index('hashtags_trending_score_idx').on(table.trending_score)
}));

// Post hashtags junction table
export const postHashtagsTable = pgTable('post_hashtags', {
  id: text('id').primaryKey(),
  post_id: text('post_id').notNull().references(() => postsTable.id, { onDelete: 'cascade' }),
  hashtag_id: text('hashtag_id').notNull().references(() => hashtagsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  postIdIdx: index('post_hashtags_post_id_idx').on(table.post_id),
  hashtagIdIdx: index('post_hashtags_hashtag_id_idx').on(table.hashtag_id),
  uniquePostHashtagIdx: index('post_hashtags_unique_idx').on(table.post_id, table.hashtag_id)
}));

// Notifications table
export const notificationsTable = pgTable('notifications', {
  id: text('id').primaryKey(),
  user_id: text('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  actor_id: text('actor_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  post_id: text('post_id').references(() => postsTable.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  is_read: boolean('is_read').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.user_id),
  isReadIdx: index('notifications_is_read_idx').on(table.is_read),
  createdAtIdx: index('notifications_created_at_idx').on(table.created_at)
}));

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  posts: postsTable,
  skills: skillsTable,
  userSkills: userSkillsTable,
  follows: followsTable,
  likes: likesTable,
  bookmarks: bookmarksTable,
  messages: messagesTable,
  projects: projectsTable,
  hashtags: hashtagsTable,
  postHashtags: postHashtagsTable,
  notifications: notificationsTable
};
