
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, followsTable } from '../db/schema';
import { getFollowers } from '../handlers/get_followers';

// Test user data
const testUser = {
  id: 'user-1',
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

const follower1 = {
  id: 'follower-1',
  email: 'follower1@example.com',
  username: 'follower1',
  display_name: 'Follower One',
  bio: 'First follower bio',
  avatar_url: 'https://example.com/avatar1.jpg',
  banner_url: null,
  location: 'New York',
  website: null,
  github_url: null,
  portfolio_url: null
};

const follower2 = {
  id: 'follower-2',
  email: 'follower2@example.com',
  username: 'follower2',
  display_name: 'Follower Two',
  bio: null,
  avatar_url: null,
  banner_url: null,
  location: null,
  website: 'https://follower2.com',
  github_url: 'https://github.com/follower2',
  portfolio_url: null
};

describe('getFollowers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return followers for a user', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser, follower1, follower2]).execute();

    // Create follow relationships
    await db.insert(followsTable).values([
      {
        id: 'follow-1',
        follower_id: follower1.id,
        following_id: testUser.id
      },
      {
        id: 'follow-2',
        follower_id: follower2.id,
        following_id: testUser.id
      }
    ]).execute();

    const result = await getFollowers(testUser.id);

    expect(result).toHaveLength(2);
    
    // Check that we get the follower users
    const followerIds = result.map(user => user.id);
    expect(followerIds).toContain(follower1.id);
    expect(followerIds).toContain(follower2.id);

    // Verify user data structure
    const firstFollower = result.find(user => user.id === follower1.id);
    expect(firstFollower).toBeDefined();
    expect(firstFollower?.username).toEqual('follower1');
    expect(firstFollower?.display_name).toEqual('Follower One');
    expect(firstFollower?.bio).toEqual('First follower bio');
    expect(firstFollower?.location).toEqual('New York');
    expect(firstFollower?.created_at).toBeInstanceOf(Date);
    expect(firstFollower?.updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when user has no followers', async () => {
    // Create test user but no followers
    await db.insert(usersTable).values([testUser]).execute();

    const result = await getFollowers(testUser.id);

    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Create test user and multiple followers
    const followers = Array.from({ length: 5 }, (_, i) => ({
      id: `follower-${i + 1}`,
      email: `follower${i + 1}@example.com`,
      username: `follower${i + 1}`,
      display_name: `Follower ${i + 1}`,
      bio: null,
      avatar_url: null,
      banner_url: null,
      location: null,
      website: null,
      github_url: null,
      portfolio_url: null
    }));

    await db.insert(usersTable).values([testUser, ...followers]).execute();

    // Create follow relationships
    const follows = followers.map((follower, i) => ({
      id: `follow-${i + 1}`,
      follower_id: follower.id,
      following_id: testUser.id
    }));

    await db.insert(followsTable).values(follows).execute();

    const result = await getFollowers(testUser.id, 3);

    expect(result).toHaveLength(3);
  });

  it('should respect offset parameter', async () => {
    // Create test user and followers
    const followers = Array.from({ length: 3 }, (_, i) => ({
      id: `follower-${i + 1}`,
      email: `follower${i + 1}@example.com`,
      username: `follower${i + 1}`,
      display_name: `Follower ${i + 1}`,
      bio: null,
      avatar_url: null,
      banner_url: null,
      location: null,
      website: null,
      github_url: null,
      portfolio_url: null
    }));

    await db.insert(usersTable).values([testUser, ...followers]).execute();

    // Create follow relationships with slight delay to ensure ordering
    for (let i = 0; i < followers.length; i++) {
      await db.insert(followsTable).values([{
        id: `follow-${i + 1}`,
        follower_id: followers[i].id,
        following_id: testUser.id
      }]).execute();
    }

    // Get first page
    const firstPage = await getFollowers(testUser.id, 2, 0);
    // Get second page
    const secondPage = await getFollowers(testUser.id, 2, 2);

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(1);

    // Ensure no overlap between pages
    const firstPageIds = firstPage.map(user => user.id);
    const secondPageIds = secondPage.map(user => user.id);
    expect(firstPageIds).not.toContain(secondPageIds[0]);
  });

  it('should order followers by follow creation date descending', async () => {
    // Create test user and followers
    await db.insert(usersTable).values([testUser, follower1, follower2]).execute();

    // Create follow relationships in specific order
    await db.insert(followsTable).values([
      {
        id: 'follow-1',
        follower_id: follower1.id,
        following_id: testUser.id
      }
    ]).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(followsTable).values([
      {
        id: 'follow-2',
        follower_id: follower2.id,
        following_id: testUser.id
      }
    ]).execute();

    const result = await getFollowers(testUser.id);

    // Most recent follower should be first
    expect(result[0].id).toEqual(follower2.id);
    expect(result[1].id).toEqual(follower1.id);
  });
});
