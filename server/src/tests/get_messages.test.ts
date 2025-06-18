
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { getMessages } from '../handlers/get_messages';

// Test users
const testUser1 = {
  id: 'user1',
  email: 'user1@example.com',
  username: 'user1',
  display_name: 'User One'
};

const testUser2 = {
  id: 'user2',
  email: 'user2@example.com',
  username: 'user2',
  display_name: 'User Two'
};

const testUser3 = {
  id: 'user3',
  email: 'user3@example.com',
  username: 'user3',
  display_name: 'User Three'
};

describe('getMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return messages between two users', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2, testUser3]).execute();

    // Create messages with explicit timestamps to ensure ordering
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier
    const later = new Date(now.getTime() + 60000); // 1 minute later

    await db.insert(messagesTable).values([
      {
        id: 'msg1',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'Hello from user1',
        created_at: earlier,
        updated_at: earlier
      },
      {
        id: 'msg2',
        sender_id: 'user2',
        recipient_id: 'user1',
        content: 'Hello back from user2',
        created_at: later,
        updated_at: later
      },
      {
        id: 'msg3',
        sender_id: 'user1',
        recipient_id: 'user3',
        content: 'Message to user3',
        created_at: now,
        updated_at: now
      }
    ]).execute();

    const result = await getMessages('user1', 'user2');

    expect(result).toHaveLength(2);
    // Most recent message first (descending order)
    expect(result[0].content).toEqual('Hello back from user2');
    expect(result[1].content).toEqual('Hello from user1');
    
    // Verify bidirectional conversation
    expect(result.some(msg => msg.sender_id === 'user1' && msg.recipient_id === 'user2')).toBe(true);
    expect(result.some(msg => msg.sender_id === 'user2' && msg.recipient_id === 'user1')).toBe(true);
  });

  it('should return messages in descending order by created_at', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2]).execute();

    // Create messages with different timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier
    const latest = new Date(now.getTime() + 60000); // 1 minute later

    await db.insert(messagesTable).values([
      {
        id: 'msg1',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'First message',
        created_at: earlier,
        updated_at: earlier
      },
      {
        id: 'msg2',
        sender_id: 'user2',
        recipient_id: 'user1',
        content: 'Second message',
        created_at: now,
        updated_at: now
      },
      {
        id: 'msg3',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'Third message',
        created_at: latest,
        updated_at: latest
      }
    ]).execute();

    const result = await getMessages('user1', 'user2');

    expect(result).toHaveLength(3);
    expect(result[0].content).toEqual('Third message');
    expect(result[1].content).toEqual('Second message');
    expect(result[2].content).toEqual('First message');
  });

  it('should respect limit parameter', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2]).execute();

    // Create multiple messages with different timestamps
    const baseTime = new Date();
    const messages = Array.from({ length: 10 }, (_, i) => ({
      id: `msg${i}`,
      sender_id: 'user1',
      recipient_id: 'user2',
      content: `Message ${i}`,
      created_at: new Date(baseTime.getTime() + i * 1000), // 1 second apart
      updated_at: new Date(baseTime.getTime() + i * 1000)
    }));

    await db.insert(messagesTable).values(messages).execute();

    const result = await getMessages('user1', 'user2', 5);

    expect(result).toHaveLength(5);
  });

  it('should respect offset parameter', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2]).execute();

    // Create messages with explicit timestamps
    const baseTime = new Date();
    await db.insert(messagesTable).values([
      {
        id: 'msg1',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'Message 1',
        created_at: new Date(baseTime.getTime() + 1000),
        updated_at: new Date(baseTime.getTime() + 1000)
      },
      {
        id: 'msg2',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'Message 2',
        created_at: new Date(baseTime.getTime() + 2000),
        updated_at: new Date(baseTime.getTime() + 2000)
      },
      {
        id: 'msg3',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'Message 3',
        created_at: new Date(baseTime.getTime() + 3000),
        updated_at: new Date(baseTime.getTime() + 3000)
      }
    ]).execute();

    const result = await getMessages('user1', 'user2', 10, 1);

    expect(result).toHaveLength(2);
    // Should skip the first message (most recent - Message 3)
    expect(result[0].content).toEqual('Message 2');
    expect(result[1].content).toEqual('Message 1');
  });

  it('should return empty array when no messages exist', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2]).execute();

    const result = await getMessages('user1', 'user2');

    expect(result).toHaveLength(0);
  });

  it('should only return messages between specified users', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2, testUser3]).execute();

    // Create messages between different user pairs
    await db.insert(messagesTable).values([
      {
        id: 'msg1',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'Message between user1 and user2'
      },
      {
        id: 'msg2',
        sender_id: 'user1',
        recipient_id: 'user3',
        content: 'Message between user1 and user3'
      },
      {
        id: 'msg3',
        sender_id: 'user2',
        recipient_id: 'user3',
        content: 'Message between user2 and user3'
      }
    ]).execute();

    const result = await getMessages('user1', 'user2');

    expect(result).toHaveLength(1);
    expect(result[0].content).toEqual('Message between user1 and user2');
  });

  it('should include all message fields', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2]).execute();

    // Create message with all fields
    await db.insert(messagesTable).values([
      {
        id: 'msg1',
        sender_id: 'user1',
        recipient_id: 'user2',
        content: 'Test message',
        file_url: 'https://example.com/file.pdf',
        file_name: 'document.pdf',
        file_type: 'application/pdf',
        is_read: true
      }
    ]).execute();

    const result = await getMessages('user1', 'user2');

    expect(result).toHaveLength(1);
    const message = result[0];
    expect(message.id).toEqual('msg1');
    expect(message.sender_id).toEqual('user1');
    expect(message.recipient_id).toEqual('user2');
    expect(message.content).toEqual('Test message');
    expect(message.file_url).toEqual('https://example.com/file.pdf');
    expect(message.file_name).toEqual('document.pdf');
    expect(message.file_type).toEqual('application/pdf');
    expect(message.is_read).toBe(true);
    expect(message.created_at).toBeInstanceOf(Date);
    expect(message.updated_at).toBeInstanceOf(Date);
  });
});
