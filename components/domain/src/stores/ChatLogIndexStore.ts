import type { ChatLogIndex } from '@blargbot/chatlog-types';

export interface ChatLogIndexStore {
    add(index: ChatLogIndex): Promise<boolean>;
    get(id: string): Promise<ChatLogIndex | undefined>;
}
