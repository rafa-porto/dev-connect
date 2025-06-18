
import { type GetFeedInput, type Post } from '../schema';

export declare function getUserFeed(input: GetFeedInput): Promise<Post[]>;
