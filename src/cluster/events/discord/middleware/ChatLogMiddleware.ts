import { ChatLogManager } from '@blargbot/cluster/managers/moderation';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

export class ChatLogMiddleware implements IMiddleware<KnownMessage, boolean> {
    readonly #chatlog: ChatLogManager;

    public constructor(chatlog: ChatLogManager) {
        this.#chatlog = chatlog;
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.#chatlog.messageCreated(context);
        const result = await next();
        await process;
        return result;
    }
}
