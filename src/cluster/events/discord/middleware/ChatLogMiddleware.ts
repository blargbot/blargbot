import type { ChatLogManager } from '@blargbot/cluster/managers/moderation/index.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type * as eris from 'eris';

export class ChatLogMiddleware implements IMiddleware<eris.KnownMessage, boolean> {
    readonly #chatlog: ChatLogManager;

    public constructor(chatlog: ChatLogManager) {
        this.#chatlog = chatlog;
    }

    public async execute(context: eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.#chatlog.messageCreated(context);
        const result = await next();
        await process;
        return result;
    }
}
