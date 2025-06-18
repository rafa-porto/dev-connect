
import { db } from '../db';
import { hashtagsTable } from '../db/schema';
import { type Hashtag } from '../schema';
import { desc } from 'drizzle-orm';

export const getTrendingHashtags = async (limit: number = 10): Promise<Hashtag[]> => {
  try {
    const results = await db.select()
      .from(hashtagsTable)
      .orderBy(desc(hashtagsTable.trending_score))
      .limit(limit)
      .execute();

    return results.map(hashtag => ({
      ...hashtag,
      trending_score: parseFloat(hashtag.trending_score.toString()) // Convert real to number
    }));
  } catch (error) {
    console.error('Get trending hashtags failed:', error);
    throw error;
  }
};
