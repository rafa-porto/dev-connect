
import { db } from '../db';
import { bookmarksTable, postsTable, usersTable } from '../db/schema';
import { type CreateBookmarkInput, type Bookmark } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const createBookmark = async (input: CreateBookmarkInput): Promise<Bookmark> => {
  try {
    // Verify that the user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Verify that the post exists
    const post = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, input.post_id))
      .execute();

    if (post.length === 0) {
      throw new Error('Post not found');
    }

    // Insert bookmark record
    const result = await db.insert(bookmarksTable)
      .values({
        id: randomUUID(),
        user_id: input.user_id,
        post_id: input.post_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Bookmark creation failed:', error);
    throw error;
  }
};
