
import { type User } from '../schema';

export declare function getFollowing(userId: string, limit?: number, offset?: number): Promise<User[]>;
