
import { db } from '../db';
import { likesTable, postsTable, usersTable } from '../db/schema';
import { type CreateLikeInput, type Like } from '../schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const createLike = async (input: CreateLikeInput): Promise<Like> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Verify post exists
    const post = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, input.post_id))
      .execute();

    if (post.length === 0) {
      throw new Error(`Post with id ${input.post_id} not found`);
    }

    // Check if like already exists - combine conditions with and()
    const existingLike = await db.select()
      .from(likesTable)
      .where(and(
        eq(likesTable.user_id, input.user_id),
        eq(likesTable.post_id, input.post_id)
      ))
      .execute();

    if (existingLike.length > 0) {
      throw new Error('User has already liked this post');
    }

    // Create the like record
    const result = await db.insert(likesTable)
      .values({
        id: randomUUID(),
        user_id: input.user_id,
        post_id: input.post_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Like creation failed:', error);
    throw error;
  }
};
