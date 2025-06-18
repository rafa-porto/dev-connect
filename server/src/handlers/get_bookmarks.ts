
import { type Post } from '../schema';

export declare function getBookmarks(userId: string, limit?: number, offset?: number): Promise<Post[]>;
