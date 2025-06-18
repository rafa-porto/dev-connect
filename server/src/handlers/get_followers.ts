
import { type User } from '../schema';

export declare function getFollowers(userId: string, limit?: number, offset?: number): Promise<User[]>;
