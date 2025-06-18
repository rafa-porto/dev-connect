
import { db } from '../db';
import { postsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deletePost = async (postId: string, userId: string): Promise<void> => {
  try {
    // Delete the post only if it belongs to the user
    const result = await db.delete(postsTable)
      .where(and(
        eq(postsTable.id, postId),
        eq(postsTable.user_id, userId)
      ))
      .returning({ id: postsTable.id })
      .execute();

    // Check if any post was actually deleted
    if (result.length === 0) {
      throw new Error('Post not found or unauthorized');
    }
  } catch (error) {
    console.error('Post deletion failed:', error);
    throw error;
  }
};
