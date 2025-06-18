
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createPostInputSchema,
  createFollowInputSchema,
  createLikeInputSchema,
  createBookmarkInputSchema,
  createMessageInputSchema,
  createProjectInputSchema,
  getFeedInputSchema,
  searchInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUser } from './handlers/get_user';
import { updateUser } from './handlers/update_user';
import { createPost } from './handlers/create_post';
import { getPosts } from './handlers/get_posts';
import { getPost } from './handlers/get_post';
import { deletePost } from './handlers/delete_post';
import { createFollow } from './handlers/create_follow';
import { unfollowUser } from './handlers/unfollow_user';
import { getFollowers } from './handlers/get_followers';
import { getFollowing } from './handlers/get_following';
import { createLike } from './handlers/create_like';
import { unlikePost } from './handlers/unlike_post';
import { createBookmark } from './handlers/create_bookmark';
import { removeBookmark } from './handlers/remove_bookmark';
import { getBookmarks } from './handlers/get_bookmarks';
import { createMessage } from './handlers/create_message';
import { getMessages } from './handlers/get_messages';
import { markMessageRead } from './handlers/mark_message_read';
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { getUserFeed } from './handlers/get_user_feed';
import { searchContent } from './handlers/search_content';
import { getTrendingHashtags } from './handlers/get_trending_hashtags';
import { getNotifications } from './handlers/get_notifications';
import { markNotificationRead } from './handlers/mark_notification_read';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  getUser: publicProcedure
    .input(z.string())
    .query(({ input }) => getUser(input)),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  // Post routes
  createPost: publicProcedure
    .input(createPostInputSchema)
    .mutation(({ input }) => createPost(input)),

  getPosts: publicProcedure
    .input(z.object({
      userId: z.string().optional(),
      limit: z.number().int().min(1).max(50).optional(),
      offset: z.number().int().min(0).optional()
    }).optional())
    .query(({ input }) => getPosts(input?.userId, input?.limit, input?.offset)),

  getPost: publicProcedure
    .input(z.string())
    .query(({ input }) => getPost(input)),

  deletePost: publicProcedure
    .input(z.object({
      postId: z.string(),
      userId: z.string()
    }))
    .mutation(({ input }) => deletePost(input.postId, input.userId)),

  // Follow routes
  followUser: publicProcedure
    .input(createFollowInputSchema)
    .mutation(({ input }) => createFollow(input)),

  unfollowUser: publicProcedure
    .input(z.object({
      followerId: z.string(),
      followingId: z.string()
    }))
    .mutation(({ input }) => unfollowUser(input.followerId, input.followingId)),

  getFollowers: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().int().min(1).max(50).optional(),
      offset: z.number().int().min(0).optional()
    }))
    .query(({ input }) => getFollowers(input.userId, input.limit, input.offset)),

  getFollowing: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().int().min(1).max(50).optional(),
      offset: z.number().int().min(0).optional()
    }))
    .query(({ input }) => getFollowing(input.userId, input.limit, input.offset)),

  // Like routes
  likePost: publicProcedure
    .input(createLikeInputSchema)
    .mutation(({ input }) => createLike(input)),

  unlikePost: publicProcedure
    .input(z.object({
      userId: z.string(),
      postId: z.string()
    }))
    .mutation(({ input }) => unlikePost(input.userId, input.postId)),

  // Bookmark routes
  bookmarkPost: publicProcedure
    .input(createBookmarkInputSchema)
    .mutation(({ input }) => createBookmark(input)),

  removeBookmark: publicProcedure
    .input(z.object({
      userId: z.string(),
      postId: z.string()
    }))
    .mutation(({ input }) => removeBookmark(input.userId, input.postId)),

  getBookmarks: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().int().min(1).max(50).optional(),
      offset: z.number().int().min(0).optional()
    }))
    .query(({ input }) => getBookmarks(input.userId, input.limit, input.offset)),

  // Message routes
  sendMessage: publicProcedure
    .input(createMessageInputSchema)
    .mutation(({ input }) => createMessage(input)),

  getMessages: publicProcedure
    .input(z.object({
      userId: z.string(),
      otherUserId: z.string(),
      limit: z.number().int().min(1).max(50).optional(),
      offset: z.number().int().min(0).optional()
    }))
    .query(({ input }) => getMessages(input.userId, input.otherUserId, input.limit, input.offset)),

  markMessageRead: publicProcedure
    .input(z.object({
      messageId: z.string(),
      userId: z.string()
    }))
    .mutation(({ input }) => markMessageRead(input.messageId, input.userId)),

  // Project routes
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),

  getProjects: publicProcedure
    .input(z.string())
    .query(({ input }) => getProjects(input)),

  // Feed and discovery routes
  getUserFeed: publicProcedure
    .input(getFeedInputSchema)
    .query(({ input }) => getUserFeed(input)),

  searchContent: publicProcedure
    .input(searchInputSchema)
    .query(({ input }) => searchContent(input)),

  getTrendingHashtags: publicProcedure
    .input(z.number().int().min(1).max(50).optional())
    .query(({ input }) => getTrendingHashtags(input)),

  // Notification routes
  getNotifications: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().int().min(1).max(50).optional(),
      offset: z.number().int().min(0).optional()
    }))
    .query(({ input }) => getNotifications(input.userId, input.limit, input.offset)),

  markNotificationRead: publicProcedure
    .input(z.object({
      notificationId: z.string(),
      userId: z.string()
    }))
    .mutation(({ input }) => markNotificationRead(input.notificationId, input.userId))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
