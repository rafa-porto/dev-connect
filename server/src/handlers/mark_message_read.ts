
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const markMessageRead = async (messageId: string, userId: string): Promise<void> => {
  try {
    await db.update(messagesTable)
      .set({ is_read: true })
      .where(and(
        eq(messagesTable.id, messageId),
        eq(messagesTable.recipient_id, userId)
      ))
      .execute();
  } catch (error) {
    console.error('Failed to mark message as read:', error);
    throw error;
  }
};
