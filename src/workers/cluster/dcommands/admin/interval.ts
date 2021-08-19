import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { codeBlock, CommandType, guard } from '@cluster/utils';
import { MessageOptions } from 'discord.js';

export class IntervalCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'interval',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: 'set {~code+}',
                    description: 'Sets the code to run every 15 minutes',
                    execute: (ctx, [code]) => this.setInterval(ctx, code)
                },
                {
                    parameters: 'raw',
                    description: 'Gets the current code that the interval is running',
                    execute: (ctx) => this.getRaw(ctx)
                },
                {
                    parameters: 'delete',
                    description: 'Deletes the current interval',
                    execute: (ctx) => this.deleteInterval(ctx)
                },
                {
                    parameters: 'setauthorizer',
                    description: 'sets the interval to run using your permissions',
                    execute: (ctx) => this.setAuthorizer(ctx)
                }
            ]
        });
    }

    public async setInterval(context: GuildCommandContext, code: string): Promise<string> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id) ?? {};
        await context.database.guilds.setInterval(context.channel.guild.id, { ...interval, content: code, author: context.author.id });
        return this.success('The interval has been set');
    }

    public async deleteInterval(context: GuildCommandContext): Promise<string> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return this.error('There is no interval currently set up!');

        await context.database.guilds.setInterval(context.channel.guild.id, undefined);
        return this.success('The interval has been deleted');
    }

    public async getRaw(context: GuildCommandContext): Promise<string | MessageOptions> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return this.error('There is no interval currently set up!');

        const response = this.success(`The raw code for the interval is:\n${codeBlock(interval.content)}`);
        return guard.checkMessageSize(response)
            ? response
            : {
                content: this.success('The raw code for the interval is attached'),
                files: [
                    {
                        name: 'interval.bbtag',
                        attachment: interval.content
                    }
                ]
            };
    }

    public async setAuthorizer(context: GuildCommandContext): Promise<string> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return this.error('There is no interval currently set up!');

        await context.database.guilds.setInterval(context.channel.guild.id, { ...interval, authorizer: context.author.id });
        return this.success('Your permissions will now be used when the interval runs');
    }
}
