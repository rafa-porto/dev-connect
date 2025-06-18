
import { db } from '../db';
import { postsTable, followsTable } from '../db/schema';
import { type GetFeedInput, type Post } from '../schema';
import { eq, desc, inArray, or } from 'drizzle-orm';

export const getUserFeed = async (input: GetFeedInput): Promise<Post[]> => {
  try {
    // Set default values for pagination
    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    // First, get the list of users that the current user follows
    const followingUsers = await db.select({
      following_id: followsTable.following_id
    })
    .from(followsTable)
    .where(eq(followsTable.follower_id, input.user_id))
    .execute();

    // Extract user IDs and include the current user
    const followingUserIds = followingUsers.map(f => f.following_id);
    const allUserIds = [...followingUserIds, input.user_id];

    // Build the feed query - show posts from followed users OR the user's own posts
    const results = await db.select()
      .from(postsTable)
      .where(inArray(postsTable.user_id, allUserIds))
      .orderBy(desc(postsTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    // Convert the results to match the Post schema
    return results.map(post => ({
      ...post,
      image_urls: Array.isArray(post.image_urls) ? post.image_urls as string[] : [],
      created_at: post.created_at!,
      updated_at: post.updated_at!
    }));
  } catch (error) {
    console.error('Get user feed failed:', error);
    throw error;
  }
};
