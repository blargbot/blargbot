import { ChatLogManager } from '@cluster/managers/moderation';
import { IMiddleware, NextMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class ChatlogMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly chatlog: ChatLogManager) {
    }

    public async execute(context: Message, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.chatlog.messageCreated(context);
        const result = await next();
        await process;
        return result;
    }
}
