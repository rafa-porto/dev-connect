
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type Post } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getPosts = async (userId?: string, limit: number = 20, offset: number = 0): Promise<Post[]> => {
  try {
    const baseQuery = db.select().from(postsTable);
    
    const finalQuery = userId 
      ? baseQuery.where(eq(postsTable.user_id, userId))
      : baseQuery;

    const results = await finalQuery
      .orderBy(desc(postsTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    return results.map(post => ({
      ...post,
      image_urls: Array.isArray(post.image_urls) ? post.image_urls as string[] : []
    }));
  } catch (error) {
    console.error('Get posts failed:', error);
    throw error;
  }
};
