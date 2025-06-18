
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type Message } from '../schema';
import { or, and, eq, desc } from 'drizzle-orm';

export const getMessages = async (
  userId: string,
  otherUserId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  try {
    // Get messages between two users (bidirectional conversation)
    const results = await db.select()
      .from(messagesTable)
      .where(
        or(
          and(
            eq(messagesTable.sender_id, userId),
            eq(messagesTable.recipient_id, otherUserId)
          ),
          and(
            eq(messagesTable.sender_id, otherUserId),
            eq(messagesTable.recipient_id, userId)
          )
        )
      )
      .orderBy(desc(messagesTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Get messages failed:', error);
    throw error;
  }
};
