
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { messagesTable, usersTable } from '../db/schema';
import { type CreateMessageInput } from '../schema';
import { createMessage } from '../handlers/create_message';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Test users
const testSender = {
  id: randomUUID(),
  email: 'sender@example.com',
  username: 'testsender',
  display_name: 'Test Sender'
};

const testRecipient = {
  id: randomUUID(),
  email: 'recipient@example.com',
  username: 'testrecipient',
  display_name: 'Test Recipient'
};

// Simple test input
const testInput: CreateMessageInput = {
  sender_id: testSender.id,
  recipient_id: testRecipient.id,
  content: 'Hello, this is a test message!'
};

describe('createMessage', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test users
    await db.insert(usersTable).values([testSender, testRecipient]).execute();
  });

  afterEach(resetDB);

  it('should create a message', async () => {
    const result = await createMessage(testInput);

    // Basic field validation
    expect(result.sender_id).toEqual(testSender.id);
    expect(result.recipient_id).toEqual(testRecipient.id);
    expect(result.content).toEqual('Hello, this is a test message!');
    expect(result.file_url).toBeNull();
    expect(result.file_name).toBeNull();
    expect(result.file_type).toBeNull();
    expect(result.is_read).toBe(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save message to database', async () => {
    const result = await createMessage(testInput);

    // Query database to verify message was saved
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].sender_id).toEqual(testSender.id);
    expect(messages[0].recipient_id).toEqual(testRecipient.id);
    expect(messages[0].content).toEqual('Hello, this is a test message!');
    expect(messages[0].is_read).toBe(false);
    expect(messages[0].created_at).toBeInstanceOf(Date);
  });

  it('should create message with file attachment', async () => {
    const inputWithFile: CreateMessageInput = {
      ...testInput,
      file_url: 'https://example.com/file.pdf',
      file_name: 'document.pdf',
      file_type: 'application/pdf'
    };

    const result = await createMessage(inputWithFile);

    expect(result.file_url).toEqual('https://example.com/file.pdf');
    expect(result.file_name).toEqual('document.pdf');
    expect(result.file_type).toEqual('application/pdf');
  });

  it('should throw error when sender does not exist', async () => {
    const inputWithInvalidSender: CreateMessageInput = {
      ...testInput,
      sender_id: randomUUID()
    };

    await expect(createMessage(inputWithInvalidSender)).rejects.toThrow(/sender not found/i);
  });

  it('should throw error when recipient does not exist', async () => {
    const inputWithInvalidRecipient: CreateMessageInput = {
      ...testInput,
      recipient_id: randomUUID()
    };

    await expect(createMessage(inputWithInvalidRecipient)).rejects.toThrow(/recipient not found/i);
  });

  it('should create message with optional fields as null', async () => {
    const result = await createMessage(testInput);

    expect(result.file_url).toBeNull();
    expect(result.file_name).toBeNull();
    expect(result.file_type).toBeNull();
  });
});
