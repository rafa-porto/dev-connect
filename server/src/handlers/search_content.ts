
import { db } from '../db';
import { usersTable, postsTable, hashtagsTable } from '../db/schema';
import { type SearchInput } from '../schema';
import { ilike, desc } from 'drizzle-orm';

export const searchContent = async (input: SearchInput): Promise<{
  posts?: any[];
  users?: any[];
  hashtags?: any[];
}> => {
  try {
    const { query, type, limit = 20, offset = 0 } = input;
    const searchPattern = `%${query}%`;
    
    const result: {
      posts?: any[];
      users?: any[];
      hashtags?: any[];
    } = {};

    // Search posts
    if (!type || type === 'posts') {
      result.posts = await db.select()
        .from(postsTable)
        .where(ilike(postsTable.content, searchPattern))
        .orderBy(desc(postsTable.created_at))
        .limit(limit)
        .offset(offset)
        .execute();
    }

    // Search users
    if (!type || type === 'users') {
      result.users = await db.select()
        .from(usersTable)
        .where(ilike(usersTable.username, searchPattern))
        .orderBy(desc(usersTable.follower_count))
        .limit(limit)
        .offset(offset)
        .execute();
    }

    // Search hashtags
    if (!type || type === 'hashtags') {
      const hashtagResults = await db.select()
        .from(hashtagsTable)
        .where(ilike(hashtagsTable.name, searchPattern))
        .orderBy(desc(hashtagsTable.trending_score))
        .limit(limit)
        .offset(offset)
        .execute();
      
      result.hashtags = hashtagResults.map(hashtag => ({
        ...hashtag,
        trending_score: parseFloat(hashtag.trending_score.toString())
      }));
    }

    return result;
  } catch (error) {
    console.error('Content search failed:', error);
    throw error;
  }
};
