
import { db } from '../db';
import { usersTable, followsTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export const getFollowing = async (userId: string, limit: number = 20, offset: number = 0): Promise<User[]> => {
  try {
    const results = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      username: usersTable.username,
      display_name: usersTable.display_name,
      bio: usersTable.bio,
      avatar_url: usersTable.avatar_url,
      banner_url: usersTable.banner_url,
      location: usersTable.location,
      website: usersTable.website,
      github_url: usersTable.github_url,
      portfolio_url: usersTable.portfolio_url,
      is_premium: usersTable.is_premium,
      is_verified: usersTable.is_verified,
      follower_count: usersTable.follower_count,
      following_count: usersTable.following_count,
      post_count: usersTable.post_count,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at
    })
    .from(followsTable)
    .innerJoin(usersTable, eq(followsTable.following_id, usersTable.id))
    .where(eq(followsTable.follower_id, userId))
    .limit(limit)
    .offset(offset)
    .execute();

    return results;
  } catch (error) {
    console.error('Get following failed:', error);
    throw error;
  }
};
