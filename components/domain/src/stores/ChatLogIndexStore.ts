import { ChatLogIndex } from '../models/index.js';

export interface ChatLogIndexStore {
    add(index: ChatLogIndex): Promise<boolean>;
    get(id: string): Promise<ChatLogIndex | undefined>;
}
