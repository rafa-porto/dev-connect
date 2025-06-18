
import { type Message } from '../schema';

export declare function getMessages(userId: string, otherUserId: string, limit?: number, offset?: number): Promise<Message[]>;
