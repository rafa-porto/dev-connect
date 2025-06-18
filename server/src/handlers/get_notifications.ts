
import { type Notification } from '../schema';

export declare function getNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
