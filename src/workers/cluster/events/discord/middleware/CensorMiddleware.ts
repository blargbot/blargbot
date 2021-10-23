import { CensorManager } from '@cluster/managers/moderation';
import { guard } from '@cluster/utils';
import { IMiddleware, NextMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class CensorMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly censors: CensorManager) {
    }

    public async execute(context: Message, next: NextMiddleware<boolean>): Promise<boolean> {
        if (!guard.isGuildMessage(context))
            return await next();

        if (await this.censors.censor(context))
            return true;

        return await next();
    }
}
