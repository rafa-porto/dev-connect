
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type Post } from '../schema';
import { eq } from 'drizzle-orm';

export const getPost = async (postId: string): Promise<Post | null> => {
  try {
    const results = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const post = results[0];
    return {
      ...post,
      image_urls: Array.isArray(post.image_urls) ? post.image_urls : [],
      created_at: new Date(post.created_at),
      updated_at: new Date(post.updated_at)
    };
  } catch (error) {
    console.error('Failed to get post:', error);
    throw error;
  }
};
