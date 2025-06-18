
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable } from '../db/schema';
import { deletePost } from '../handlers/delete_post';
import { eq } from 'drizzle-orm';

const testUser = {
  id: 'user123',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User'
};

const anotherUser = {
  id: 'user456',
  email: 'another@example.com',
  username: 'anotheruser',
  display_name: 'Another User'
};

const testPost = {
  id: 'post123',
  user_id: 'user123',
  content: 'Test post content',
  image_urls: [],
  tech_stack: []
};

describe('deletePost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a post when user owns it', async () => {
    // Create user and post
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(postsTable).values(testPost).execute();

    // Delete the post
    await deletePost('post123', 'user123');

    // Verify post is deleted
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'post123'))
      .execute();

    expect(posts).toHaveLength(0);
  });

  it('should throw error when post does not exist', async () => {
    // Create user but no post
    await db.insert(usersTable).values(testUser).execute();

    // Try to delete non-existent post
    expect(deletePost('nonexistent', 'user123')).rejects.toThrow(/not found or unauthorized/i);
  });

  it('should throw error when user does not own the post', async () => {
    // Create both users and post owned by first user
    await db.insert(usersTable).values([testUser, anotherUser]).execute();
    await db.insert(postsTable).values(testPost).execute();

    // Try to delete post with different user
    expect(deletePost('post123', 'user456')).rejects.toThrow(/not found or unauthorized/i);

    // Verify post still exists
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'post123'))
      .execute();

    expect(posts).toHaveLength(1);
  });

  it('should only delete the specified post', async () => {
    const secondPost = {
      id: 'post456',
      user_id: 'user123',
      content: 'Second test post',
      image_urls: [],
      tech_stack: []
    };

    // Create user and two posts
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(postsTable).values([testPost, secondPost]).execute();

    // Delete only the first post
    await deletePost('post123', 'user123');

    // Verify first post is deleted
    const deletedPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'post123'))
      .execute();
    expect(deletedPost).toHaveLength(0);

    // Verify second post still exists
    const remainingPost = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'post456'))
      .execute();
    expect(remainingPost).toHaveLength(1);
    expect(remainingPost[0].content).toEqual('Second test post');
  });
});
