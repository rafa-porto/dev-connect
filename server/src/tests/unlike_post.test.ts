
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, postsTable, likesTable } from '../db/schema';
import { unlikePost } from '../handlers/unlike_post';
import { eq, and } from 'drizzle-orm';

const testUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User'
};

const testPost = {
  id: 'test-post-1',
  user_id: 'test-user-1',
  content: 'Test post content',
  image_urls: [],
  tech_stack: []
};

const testLike = {
  id: 'test-like-1',
  user_id: 'test-user-1',
  post_id: 'test-post-1'
};

describe('unlikePost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove like from database', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(postsTable).values({
      ...testPost,
      like_count: 1
    }).execute();
    await db.insert(likesTable).values(testLike).execute();

    // Unlike the post
    await unlikePost('test-user-1', 'test-post-1');

    // Verify like is removed
    const likes = await db.select()
      .from(likesTable)
      .where(and(
        eq(likesTable.user_id, 'test-user-1'),
        eq(likesTable.post_id, 'test-post-1')
      ))
      .execute();

    expect(likes).toHaveLength(0);
  });

  it('should decrement post like count', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(postsTable).values({
      ...testPost,
      like_count: 1
    }).execute();
    await db.insert(likesTable).values(testLike).execute();

    // Unlike the post
    await unlikePost('test-user-1', 'test-post-1');

    // Verify like count is decremented
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'test-post-1'))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].like_count).toEqual(0);
  });

  it('should handle non-existent like gracefully', async () => {
    // Create prerequisite data without like
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(postsTable).values({
      ...testPost,
      like_count: 0
    }).execute();

    // Unlike non-existent like should not throw
    await expect(unlikePost('test-user-1', 'test-post-1')).resolves.toBeUndefined();

    // Verify like count remains unchanged
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'test-post-1'))
      .execute();

    expect(posts[0].like_count).toEqual(0);
  });

  it('should handle multiple likes correctly', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values([
      testUser,
      {
        id: 'test-user-2',
        email: 'test2@example.com',
        username: 'testuser2',
        display_name: 'Test User 2'
      }
    ]).execute();

    await db.insert(postsTable).values({
      ...testPost,
      like_count: 2
    }).execute();

    await db.insert(likesTable).values([
      testLike,
      {
        id: 'test-like-2',
        user_id: 'test-user-2',
        post_id: 'test-post-1'
      }
    ]).execute();

    // Unlike from first user
    await unlikePost('test-user-1', 'test-post-1');

    // Verify only one like remains
    const likes = await db.select()
      .from(likesTable)
      .where(eq(likesTable.post_id, 'test-post-1'))
      .execute();

    expect(likes).toHaveLength(1);
    expect(likes[0].user_id).toEqual('test-user-2');

    // Verify like count is decremented to 1
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, 'test-post-1'))
      .execute();

    expect(posts[0].like_count).toEqual(1);
  });
});
