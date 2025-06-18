
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields and some optional ones
const testInput: CreateUserInput = {
  email: 'test@example.com',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'A test user bio',
  avatar_url: 'https://example.com/avatar.jpg',
  location: 'Test City',
  website: 'https://testuser.com',
  github_url: 'https://github.com/testuser',
  portfolio_url: 'https://portfolio.testuser.com'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Verify all fields are correctly set
    expect(result.email).toEqual('test@example.com');
    expect(result.username).toEqual('testuser');
    expect(result.display_name).toEqual('Test User');
    expect(result.bio).toEqual('A test user bio');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.location).toEqual('Test City');
    expect(result.website).toEqual('https://testuser.com');
    expect(result.github_url).toEqual('https://github.com/testuser');
    expect(result.portfolio_url).toEqual('https://portfolio.testuser.com');
    
    // Verify generated and default fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.banner_url).toBeNull();
    expect(result.is_premium).toBe(false);
    expect(result.is_verified).toBe(false);
    expect(result.follower_count).toBe(0);
    expect(result.following_count).toBe(0);
    expect(result.post_count).toBe(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with minimal required fields', async () => {
    const minimalInput: CreateUserInput = {
      email: 'minimal@example.com',
      username: 'minimal',
      display_name: 'Minimal User'
    };

    const result = await createUser(minimalInput);

    expect(result.email).toEqual('minimal@example.com');
    expect(result.username).toEqual('minimal');
    expect(result.display_name).toEqual('Minimal User');
    expect(result.bio).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.location).toBeNull();
    expect(result.website).toBeNull();
    expect(result.github_url).toBeNull();
    expect(result.portfolio_url).toBeNull();
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query the database to verify the user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.username).toEqual('testuser');
    expect(savedUser.display_name).toEqual('Test User');
    expect(savedUser.bio).toEqual('A test user bio');
    expect(savedUser.created_at).toBeInstanceOf(Date);
  });

  it('should generate unique user IDs', async () => {
    const user1 = await createUser({
      ...testInput,
      email: 'user1@example.com',
      username: 'user1'
    });

    const user2 = await createUser({
      ...testInput,
      email: 'user2@example.com',
      username: 'user2'
    });

    expect(user1.id).toBeDefined();
    expect(user2.id).toBeDefined();
    expect(user1.id).not.toEqual(user2.id);
  });

  it('should fail with duplicate email', async () => {
    await createUser(testInput);

    const duplicateEmailInput: CreateUserInput = {
      ...testInput,
      username: 'different_username'
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should fail with duplicate username', async () => {
    await createUser(testInput);

    const duplicateUsernameInput: CreateUserInput = {
      ...testInput,
      email: 'different@example.com'
    };

    await expect(createUser(duplicateUsernameInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });
});
