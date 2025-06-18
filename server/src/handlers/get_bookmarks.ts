
import { db } from '../db';
import { bookmarksTable, postsTable } from '../db/schema';
import { type Post } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getBookmarks = async (userId: string, limit: number = 20, offset: number = 0): Promise<Post[]> => {
  try {
    const results = await db.select({
      id: postsTable.id,
      user_id: postsTable.user_id,
      content: postsTable.content,
      code_snippet: postsTable.code_snippet,
      code_language: postsTable.code_language,
      image_urls: postsTable.image_urls,
      link_url: postsTable.link_url,
      link_title: postsTable.link_title,
      link_description: postsTable.link_description,
      parent_post_id: postsTable.parent_post_id,
      repost_id: postsTable.repost_id,
      repost_comment: postsTable.repost_comment,
      like_count: postsTable.like_count,
      reply_count: postsTable.reply_count,
      repost_count: postsTable.repost_count,
      bookmark_count: postsTable.bookmark_count,
      view_count: postsTable.view_count,
      is_pinned: postsTable.is_pinned,
      created_at: postsTable.created_at,
      updated_at: postsTable.updated_at
    })
    .from(bookmarksTable)
    .innerJoin(postsTable, eq(bookmarksTable.post_id, postsTable.id))
    .where(eq(bookmarksTable.user_id, userId))
    .orderBy(desc(bookmarksTable.created_at))
    .limit(limit)
    .offset(offset)
    .execute();

    return results.map(post => ({
      ...post,
      image_urls: Array.isArray(post.image_urls) ? post.image_urls as string[] : []
    }));
  } catch (error) {
    console.error('Get bookmarks failed:', error);
    throw error;
  }
};
