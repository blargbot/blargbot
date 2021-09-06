import { ChatLogManager } from '@cluster/managers/moderation';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class ChatlogMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly chatlog: ChatLogManager) {
    }

    public async execute(context: Message, next: () => Promise<boolean>): Promise<boolean> {
        const [, result] = await Promise.all([
            this.chatlog.messageCreated(context),
            next()
        ]);
        return result;
    }
}
