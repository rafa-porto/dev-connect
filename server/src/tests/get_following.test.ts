
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, followsTable } from '../db/schema';
import { getFollowing } from '../handlers/get_following';

const testUser1 = {
  id: 'user1',
  email: 'user1@example.com',
  username: 'user1',
  display_name: 'User One',
  bio: null,
  avatar_url: null,
  banner_url: null,
  location: null,
  website: null,
  github_url: null,
  portfolio_url: null
};

const testUser2 = {
  id: 'user2',
  email: 'user2@example.com',
  username: 'user2',
  display_name: 'User Two',
  bio: 'Developer',
  avatar_url: 'https://example.com/avatar2.jpg',
  banner_url: null,
  location: 'San Francisco',
  website: 'https://user2.com',
  github_url: 'https://github.com/user2',
  portfolio_url: null
};

const testUser3 = {
  id: 'user3',
  email: 'user3@example.com',
  username: 'user3',
  display_name: 'User Three',
  bio: null,
  avatar_url: null,
  banner_url: null,
  location: null,
  website: null,
  github_url: null,
  portfolio_url: null
};

describe('getFollowing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return users that the given user is following', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2, testUser3]).execute();

    // Create follow relationships - user1 follows user2 and user3
    await db.insert(followsTable).values([
      {
        id: 'follow1',
        follower_id: 'user1',
        following_id: 'user2'
      },
      {
        id: 'follow2',
        follower_id: 'user1',
        following_id: 'user3'
      }
    ]).execute();

    const result = await getFollowing('user1');

    expect(result).toHaveLength(2);
    
    // Check that we get the correct users
    const userIds = result.map(user => user.id).sort();
    expect(userIds).toEqual(['user2', 'user3']);

    // Verify user data structure
    const user2 = result.find(user => user.id === 'user2');
    expect(user2).toBeDefined();
    expect(user2!.username).toBe('user2');
    expect(user2!.display_name).toBe('User Two');
    expect(user2!.email).toBe('user2@example.com');
    expect(user2!.bio).toBe('Developer');
    expect(user2!.location).toBe('San Francisco');
    expect(user2!.is_premium).toBe(false);
    expect(user2!.is_verified).toBe(false);
    expect(user2!.follower_count).toBe(0);
    expect(user2!.following_count).toBe(0);
    expect(user2!.post_count).toBe(0);
    expect(user2!.created_at).toBeInstanceOf(Date);
    expect(user2!.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when user follows no one', async () => {
    // Create test user
    await db.insert(usersTable).values([testUser1]).execute();

    const result = await getFollowing('user1');

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent user', async () => {
    const result = await getFollowing('non-existent-user');

    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2, testUser3]).execute();

    // Create follow relationships
    await db.insert(followsTable).values([
      {
        id: 'follow1',
        follower_id: 'user1',
        following_id: 'user2'
      },
      {
        id: 'follow2',
        follower_id: 'user1',
        following_id: 'user3'
      }
    ]).execute();

    const result = await getFollowing('user1', 1);

    expect(result).toHaveLength(1);
  });

  it('should respect offset parameter', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2, testUser3]).execute();

    // Create follow relationships
    await db.insert(followsTable).values([
      {
        id: 'follow1',
        follower_id: 'user1',
        following_id: 'user2'
      },
      {
        id: 'follow2',
        follower_id: 'user1',
        following_id: 'user3'
      }
    ]).execute();

    const result = await getFollowing('user1', 10, 1);

    expect(result).toHaveLength(1);
    
    // Should get the second user (offset skips first)
    const firstResult = await getFollowing('user1', 1, 0);
    const offsetResult = result[0];
    expect(offsetResult.id).not.toBe(firstResult[0].id);
  });

  it('should only return users followed by the specified user', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2, testUser3]).execute();

    // Create follow relationships - user1 follows user2, user2 follows user3
    await db.insert(followsTable).values([
      {
        id: 'follow1',
        follower_id: 'user1',
        following_id: 'user2'
      },
      {
        id: 'follow2',
        follower_id: 'user2',
        following_id: 'user3'
      }
    ]).execute();

    const result = await getFollowing('user1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('user2');
  });
});
