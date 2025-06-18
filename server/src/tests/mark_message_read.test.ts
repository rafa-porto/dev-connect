
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { markMessageRead } from '../handlers/mark_message_read';
import { eq } from 'drizzle-orm';

// Test user data
const testSender = {
  id: 'sender-1',
  email: 'sender@test.com',
  username: 'sender_user',
  display_name: 'Sender User'
};

const testRecipient = {
  id: 'recipient-1',
  email: 'recipient@test.com',
  username: 'recipient_user',
  display_name: 'Recipient User'
};

// Test message data
const testMessage = {
  id: 'message-1',
  sender_id: testSender.id,
  recipient_id: testRecipient.id,
  content: 'Test message content'
};

describe('markMessageRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark message as read', async () => {
    // Create test users
    await db.insert(usersTable).values([testSender, testRecipient]).execute();

    // Create test message (unread by default)
    await db.insert(messagesTable).values(testMessage).execute();

    // Verify message is initially unread
    const beforeUpdate = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, testMessage.id))
      .execute();
    
    expect(beforeUpdate[0].is_read).toBe(false);

    // Mark message as read
    await markMessageRead(testMessage.id, testRecipient.id);

    // Verify message is now read
    const afterUpdate = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, testMessage.id))
      .execute();

    expect(afterUpdate[0].is_read).toBe(true);
  });

  it('should only update message for correct recipient', async () => {
    // Create test users
    await db.insert(usersTable).values([testSender, testRecipient]).execute();

    // Create test message
    await db.insert(messagesTable).values(testMessage).execute();

    // Try to mark message as read with wrong user ID (sender instead of recipient)
    await markMessageRead(testMessage.id, testSender.id);

    // Verify message remains unread (should not update for sender)
    const result = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, testMessage.id))
      .execute();

    expect(result[0].is_read).toBe(false);
  });

  it('should handle non-existent message gracefully', async () => {
    // Create test users
    await db.insert(usersTable).values([testSender, testRecipient]).execute();

    // Try to mark non-existent message as read - should not throw
    await expect(markMessageRead('non-existent-id', testRecipient.id))
      .resolves.toBeUndefined();
  });

  it('should not affect already read messages', async () => {
    // Create test users
    await db.insert(usersTable).values([testSender, testRecipient]).execute();

    // Create already read message
    await db.insert(messagesTable).values({
      ...testMessage,
      is_read: true
    }).execute();

    // Mark as read again
    await markMessageRead(testMessage.id, testRecipient.id);

    // Verify message remains read
    const result = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, testMessage.id))
      .execute();

    expect(result[0].is_read).toBe(true);
  });
});
