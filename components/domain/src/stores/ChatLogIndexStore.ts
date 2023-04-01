import type { ChatLogIndex } from '@blargbot/chat-log-client';

export interface ChatLogIndexStore {
    add(index: ChatLogIndex): Promise<boolean>;
    get(id: string): Promise<ChatLogIndex | undefined>;
}
