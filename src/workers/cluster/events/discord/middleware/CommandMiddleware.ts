import { Cluster } from '@cluster';
import { CommandContext } from '@cluster/command';
import { CommandResult } from '@cluster/types';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class CommandMiddleware implements IMiddleware<Message, boolean> {
    public constructor(
        private readonly cluster: Cluster,
        private readonly middleware: ReadonlyArray<IMiddleware<CommandContext, CommandResult>>
    ) {
    }

    public async execute(context: Message, next: () => Promise<boolean>): Promise<boolean> {
        const prefix = await this.cluster.prefixes.findPrefix(context);
        if (prefix === undefined)
            return await next();

        if (await this.cluster.commands.execute(context, prefix, this.middleware))
            return true;

        return await next();
    }
}
