
import { db } from '../db';
import { messagesTable, usersTable } from '../db/schema';
import { type CreateMessageInput, type Message } from '../schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const createMessage = async (input: CreateMessageInput): Promise<Message> => {
  try {
    // Verify sender exists
    const sender = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.sender_id))
      .execute();

    if (sender.length === 0) {
      throw new Error('Sender not found');
    }

    // Verify recipient exists
    const recipient = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.recipient_id))
      .execute();

    if (recipient.length === 0) {
      throw new Error('Recipient not found');
    }

    // Insert message record
    const result = await db.insert(messagesTable)
      .values({
        id: randomUUID(),
        sender_id: input.sender_id,
        recipient_id: input.recipient_id,
        content: input.content,
        file_url: input.file_url || null,
        file_name: input.file_name || null,
        file_type: input.file_type || null,
        is_read: false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Message creation failed:', error);
    throw error;
  }
};
