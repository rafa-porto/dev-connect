
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, followsTable } from '../db/schema';
import { unfollowUser } from '../handlers/unfollow_user';
import { eq, and } from 'drizzle-orm';

describe('unfollowUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove follow relationship and update counts', async () => {
    // Create test users
    const follower = await db.insert(usersTable)
      .values({
        id: 'follower-1',
        email: 'follower@test.com',
        username: 'follower',
        display_name: 'Follower User',
        following_count: 1
      })
      .returning()
      .execute();

    const following = await db.insert(usersTable)
      .values({
        id: 'following-1',
        email: 'following@test.com',
        username: 'following',
        display_name: 'Following User',
        follower_count: 1
      })
      .returning()
      .execute();

    // Create follow relationship
    await db.insert(followsTable)
      .values({
        id: 'follow-1',
        follower_id: 'follower-1',
        following_id: 'following-1'
      })
      .execute();

    // Unfollow the user
    await unfollowUser('follower-1', 'following-1');

    // Verify follow relationship is deleted
    const follows = await db.select()
      .from(followsTable)
      .where(
        and(
          eq(followsTable.follower_id, 'follower-1'),
          eq(followsTable.following_id, 'following-1')
        )
      )
      .execute();

    expect(follows).toHaveLength(0);

    // Verify follower count decreased
    const updatedFollowing = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, 'following-1'))
      .execute();

    expect(updatedFollowing[0].follower_count).toEqual(0);

    // Verify following count decreased
    const updatedFollower = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, 'follower-1'))
      .execute();

    expect(updatedFollower[0].following_count).toEqual(0);
  });

  it('should not affect counts when follow relationship does not exist', async () => {
    // Create test users with initial counts
    await db.insert(usersTable)
      .values({
        id: 'user-1',
        email: 'user1@test.com',
        username: 'user1',
        display_name: 'User One',
        following_count: 5
      })
      .execute();

    await db.insert(usersTable)
      .values({
        id: 'user-2',
        email: 'user2@test.com',
        username: 'user2',
        display_name: 'User Two',
        follower_count: 3
      })
      .execute();

    // Try to unfollow when no relationship exists
    await unfollowUser('user-1', 'user-2');

    // Verify counts remain unchanged
    const user1 = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, 'user-1'))
      .execute();

    const user2 = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, 'user-2'))
      .execute();

    expect(user1[0].following_count).toEqual(5);
    expect(user2[0].follower_count).toEqual(3);
  });

  it('should handle multiple follow relationships correctly', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          id: 'user-1',
          email: 'user1@test.com',
          username: 'user1',
          display_name: 'User One',
          following_count: 2
        },
        {
          id: 'user-2',
          email: 'user2@test.com',
          username: 'user2',
          display_name: 'User Two',
          follower_count: 2
        },
        {
          id: 'user-3',
          email: 'user3@test.com',
          username: 'user3',
          display_name: 'User Three',
          follower_count: 1
        }
      ])
      .execute();

    // Create multiple follow relationships
    await db.insert(followsTable)
      .values([
        {
          id: 'follow-1',
          follower_id: 'user-1',
          following_id: 'user-2'
        },
        {
          id: 'follow-2',
          follower_id: 'user-1',
          following_id: 'user-3'
        },
        {
          id: 'follow-3',
          follower_id: 'user-3',
          following_id: 'user-2'
        }
      ])
      .execute();

    // Unfollow one specific relationship
    await unfollowUser('user-1', 'user-2');

    // Verify only the specific relationship was removed
    const remainingFollows = await db.select()
      .from(followsTable)
      .execute();

    expect(remainingFollows).toHaveLength(2);
    expect(remainingFollows.some(f => f.follower_id === 'user-1' && f.following_id === 'user-3')).toBe(true);
    expect(remainingFollows.some(f => f.follower_id === 'user-3' && f.following_id === 'user-2')).toBe(true);

    // Verify counts updated correctly
    const users = await db.select()
      .from(usersTable)
      .execute();

    const user1 = users.find(u => u.id === 'user-1');
    const user2 = users.find(u => u.id === 'user-2');
    const user3 = users.find(u => u.id === 'user-3');

    expect(user1?.following_count).toEqual(1); // Decreased from 2 to 1
    expect(user2?.follower_count).toEqual(1); // Decreased from 2 to 1
    expect(user3?.follower_count).toEqual(1); // Unchanged
  });

  it('should update timestamps correctly', async () => {
    // Create test users
    const initialTime = new Date('2024-01-01T00:00:00Z');
    
    await db.insert(usersTable)
      .values([
        {
          id: 'user-1',
          email: 'user1@test.com',
          username: 'user1',
          display_name: 'User One',
          following_count: 1,
          updated_at: initialTime
        },
        {
          id: 'user-2',
          email: 'user2@test.com',
          username: 'user2',
          display_name: 'User Two',
          follower_count: 1,
          updated_at: initialTime
        }
      ])
      .execute();

    // Create follow relationship
    await db.insert(followsTable)
      .values({
        id: 'follow-1',
        follower_id: 'user-1',
        following_id: 'user-2'
      })
      .execute();

    // Unfollow user
    await unfollowUser('user-1', 'user-2');

    // Verify timestamps were updated
    const users = await db.select()
      .from(usersTable)
      .execute();

    const user1 = users.find(u => u.id === 'user-1');
    const user2 = users.find(u => u.id === 'user-2');

    expect(user1?.updated_at.getTime()).toBeGreaterThan(initialTime.getTime());
    expect(user2?.updated_at.getTime()).toBeGreaterThan(initialTime.getTime());
  });
});
