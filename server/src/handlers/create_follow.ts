
import { db } from '../db';
import { followsTable, usersTable } from '../db/schema';
import { type CreateFollowInput, type Follow } from '../schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const createFollow = async (input: CreateFollowInput): Promise<Follow> => {
  try {
    // Prevent self-following
    if (input.follower_id === input.following_id) {
      throw new Error('Cannot follow yourself');
    }

    // Check if both users exist
    const [follower, following] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, input.follower_id)).execute(),
      db.select().from(usersTable).where(eq(usersTable.id, input.following_id)).execute()
    ]);

    if (follower.length === 0) {
      throw new Error('Follower user not found');
    }

    if (following.length === 0) {
      throw new Error('Following user not found');
    }

    // Check if follow relationship already exists
    const existingFollow = await db.select()
      .from(followsTable)
      .where(and(
        eq(followsTable.follower_id, input.follower_id),
        eq(followsTable.following_id, input.following_id)
      ))
      .execute();

    if (existingFollow.length > 0) {
      throw new Error('Already following this user');
    }

    // Create follow relationship
    const followId = randomUUID();
    const result = await db.insert(followsTable)
      .values({
        id: followId,
        follower_id: input.follower_id,
        following_id: input.following_id
      })
      .returning()
      .execute();

    // Update follower and following counts
    await Promise.all([
      // Increment follower's following_count
      db.update(usersTable)
        .set({ following_count: follower[0].following_count + 1 })
        .where(eq(usersTable.id, input.follower_id))
        .execute(),
      
      // Increment following user's follower_count
      db.update(usersTable)
        .set({ follower_count: following[0].follower_count + 1 })
        .where(eq(usersTable.id, input.following_id))
        .execute()
    ]);

    return result[0];
  } catch (error) {
    console.error('Follow creation failed:', error);
    throw error;
  }
};
