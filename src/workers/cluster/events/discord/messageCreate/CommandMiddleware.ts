import { Cluster } from '@cluster';
import { CommandContext } from '@cluster/command';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class CommandMiddleware implements IMiddleware<Message, boolean> {
    public constructor(
        private readonly cluster: Cluster
    ) {
    }

    public async execute(context: Message, next: (context?: Message) => Awaitable<boolean>): Promise<boolean> {
        const prefix = await this.cluster.prefixes.findPrefix(context);
        if (prefix === undefined)
            return await next();

        if (await this.cluster.commands.execute(new CommandContext(this.cluster, context, prefix)))
            return true;

        return await next();
    }
}
