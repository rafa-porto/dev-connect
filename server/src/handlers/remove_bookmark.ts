
import { db } from '../db';
import { bookmarksTable, postsTable } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const removeBookmark = async (userId: string, postId: string): Promise<void> => {
  try {
    // Delete the bookmark record and get the number of affected rows
    const deleteResult = await db.delete(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.user_id, userId),
          eq(bookmarksTable.post_id, postId)
        )
      )
      .execute();

    // Only decrement the bookmark count if a bookmark was actually deleted
    if (deleteResult.rowCount && deleteResult.rowCount > 0) {
      await db.update(postsTable)
        .set({
          bookmark_count: sql`${postsTable.bookmark_count} - 1`
        })
        .where(eq(postsTable.id, postId))
        .execute();
    }
  } catch (error) {
    console.error('Remove bookmark failed:', error);
    throw error;
  }
};
