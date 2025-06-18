
import { db } from '../db';
import { likesTable, postsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const unlikePost = async (userId: string, postId: string): Promise<void> => {
  try {
    // Delete the like record
    await db.delete(likesTable)
      .where(and(
        eq(likesTable.user_id, userId),
        eq(likesTable.post_id, postId)
      ))
      .execute();

    // Decrement the like count on the post
    await db.update(postsTable)
      .set({
        like_count: db.$count(likesTable, eq(likesTable.post_id, postId))
      })
      .where(eq(postsTable.id, postId))
      .execute();
  } catch (error) {
    console.error('Failed to unlike post:', error);
    throw error;
  }
};
