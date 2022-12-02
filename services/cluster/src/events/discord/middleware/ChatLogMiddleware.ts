import { ChatLogManager } from '@blargbot/cluster/managers/moderation/index.js';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import Eris from 'eris';

export class ChatLogMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    readonly #chatlog: ChatLogManager;

    public constructor(chatlog: ChatLogManager) {
        this.#chatlog = chatlog;
    }

    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.#chatlog.messageCreated(context);
        const result = await next();
        await process;
        return result;
    }
}
