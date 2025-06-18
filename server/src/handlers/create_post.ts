
import { db } from '../db';
import { postsTable, usersTable } from '../db/schema';
import { type CreatePostInput, type Post } from '../schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  try {
    // Verify user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // If it's a reply, verify parent post exists
    if (input.parent_post_id) {
      const parentPostExists = await db.select({ id: postsTable.id })
        .from(postsTable)
        .where(eq(postsTable.id, input.parent_post_id))
        .execute();

      if (parentPostExists.length === 0) {
        throw new Error('Parent post not found');
      }
    }

    // If it's a repost, verify original post exists
    if (input.repost_id) {
      const repostExists = await db.select({ id: postsTable.id })
        .from(postsTable)
        .where(eq(postsTable.id, input.repost_id))
        .execute();

      if (repostExists.length === 0) {
        throw new Error('Repost target not found');
      }
    }

    // Insert post record
    const result = await db.insert(postsTable)
      .values({
        id: nanoid(),
        user_id: input.user_id,
        content: input.content,
        code_snippet: input.code_snippet || null,
        code_language: input.code_language || null,
        image_urls: input.image_urls || [],
        link_url: input.link_url || null,
        parent_post_id: input.parent_post_id || null,
        repost_id: input.repost_id || null,
        repost_comment: input.repost_comment || null
      })
      .returning()
      .execute();

    const post = result[0];
    return {
      ...post,
      image_urls: Array.isArray(post.image_urls) ? post.image_urls as string[] : []
    };
  } catch (error) {
    console.error('Post creation failed:', error);
    throw error;
  }
};
