import { bbtag } from '@blargbot/bbtag';
import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { codeBlock, CommandType, guard } from '@blargbot/cluster/utils';
import { SendContent } from '@blargbot/core/types';
import { humanize } from '@blargbot/core/utils';

export class IntervalCommand extends GuildCommand {
    public constructor() {
        super({
            name: `interval`,
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: `set {~bbtag+}`,
                    description: `Sets the bbtag to run every 15 minutes`,
                    execute: (ctx, [bbtag]) => this.setInterval(ctx, bbtag.asString)
                },
                {
                    parameters: `raw {fileExtension:literal(bbtag|txt)=bbtag}`,
                    description: `Gets the current code that the interval is running`,
                    execute: (ctx, [fileExtension]) => this.getRaw(ctx, fileExtension.asLiteral)
                },
                {
                    parameters: `delete`,
                    description: `Deletes the current interval`,
                    execute: (ctx) => this.deleteInterval(ctx)
                },
                {
                    parameters: `setauthorizer`,
                    description: `Sets the interval to run using your permissions`,
                    execute: (ctx) => this.setAuthorizer(ctx)
                },
                {
                    parameters: `debug`,
                    description: `Runs the interval now and sends the debug output`,
                    execute: (ctx) => this.debug(ctx)
                },
                {
                    parameters: `info`,
                    description: `Shows information about the current interval`,
                    execute: (ctx) => this.getInfo(ctx)
                }
            ]
        });
    }

    public async getInfo(context: GuildCommandContext): Promise<string> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return `❌ No interval has been set yet!`;

        const authorizer = interval.authorizer ?? interval.author;
        return `ℹ️ The current interval was last edited by <@${interval.author ?? 0}> (${interval.author ?? `????`}) and is authorized by <@${authorizer ?? 0}> (${authorizer ?? `????`})`;
    }

    public async setInterval(context: GuildCommandContext, code: string): Promise<string> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id) ?? {};
        await context.database.guilds.setInterval(context.channel.guild.id, { ...interval, content: code, author: context.author.id });
        return `✅ The interval has been set`;
    }

    public async deleteInterval(context: GuildCommandContext): Promise<string> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return `❌ There is no interval currently set up!`;

        await context.database.guilds.setInterval(context.channel.guild.id, undefined);
        return `✅ The interval has been deleted`;
    }

    public async getRaw(context: GuildCommandContext, fileExtension: string): Promise<string | SendContent> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return `❌ There is no interval currently set up!`;

        const response = `ℹ️ The raw code for the interval is:\n${codeBlock(interval.content)}`;
        return !interval.content.includes(`\`\`\``) && guard.checkMessageSize(response)
            ? response
            : {
                content: `ℹ️ The raw code for the interval is attached`,
                files: [
                    {
                        name: `interval.${fileExtension}`,
                        file: interval.content
                    }
                ]
            };
    }

    public async setAuthorizer(context: GuildCommandContext): Promise<string> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return `❌ There is no interval currently set up!`;

        await context.database.guilds.setInterval(context.channel.guild.id, { ...interval, authorizer: context.author.id });
        return `✅ Your permissions will now be used when the interval runs`;
    }

    public async debug(context: GuildCommandContext): Promise<string | SendContent> {
        const interval = await context.database.guilds.getInterval(context.channel.guild.id);
        if (interval === undefined)
            return `❌ There is no interval currently set up!`;

        const result = await context.cluster.intervals.invoke(context.channel.guild, interval);
        switch (result) {
            case `FAILED`: return `❌ There was an error while running the interval!`;
            case `MISSING_AUTHORIZER`: return `❌ I couldnt find the user who authorizes the interval!`;
            case `MISSING_CHANNEL`: return `❌ I wasnt able to figure out which channel to run the interval in!`;
            case `TOO_LONG`: return `❌ The interval took longer than the max allowed time (${humanize.duration(context.cluster.intervals.timeLimit)})`;
            default:
                await context.sendDM(bbtag.createDebugOutput(result));
                return `ℹ️ Ive sent the debug output in a DM`;
        }
    }
}
