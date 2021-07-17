import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';

export class PrefixCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'prefix',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '',
                    description: 'Lists all the current prefixes on this server',
                    execute: ctx => this.listPrefixes(ctx)
                },
                {
                    parameters: 'add|set|create {prefix}',
                    description: 'Adds a command prefix to this server',
                    execute: (ctx, [prefix]) => this.addPrefix(ctx, prefix)
                },
                {
                    parameters: 'remove|delete {prefix}',
                    description: 'Removes a command prefix from this server',
                    execute: (ctx, [prefix]) => this.removePrefix(ctx, prefix)
                }
            ]
        });
    }

    public async listPrefixes(context: GuildCommandContext): Promise<string> {
        let prefixes = await context.database.guilds.getSetting(context.channel.guild.id, 'prefix');
        if (typeof prefixes === 'string')
            prefixes = [prefixes];

        if (prefixes === undefined || prefixes.length === 0)
            return this.error(`${context.channel.guild.name} has no custom prefixes!`);
        return this.info(`${context.channel.guild.name} has the following prefixes:\n${prefixes.map(p => ` - ${p}`).join('\n')}`);
    }

    public async addPrefix(context: GuildCommandContext, prefix: string): Promise<string> {
        let prefixes = await context.database.guilds.getSetting(context.channel.guild.id, 'prefix');
        switch (typeof prefixes) {
            case 'undefined':
                prefixes = [prefix];
                break;
            case 'string':
                prefixes = [prefixes, prefix];
                break;
            case 'object':
                prefixes = [...prefixes, prefix];
                break;
        }
        prefixes = [...new Set(prefixes)];
        await context.database.guilds.setSetting(context.channel.guild.id, 'prefix', prefixes);
        return this.success('The prefix has been added!');
    }

    public async removePrefix(context: GuildCommandContext, prefix: string): Promise<string> {
        let prefixes = await context.database.guilds.getSetting(context.channel.guild.id, 'prefix');
        switch (typeof prefixes) {
            case 'undefined':
                prefixes = [];
                break;
            case 'string':
                prefixes = prefixes === prefix ? [] : [prefixes];
                break;
            case 'object':
                prefixes = prefixes.filter(p => p !== prefix);
                break;
        }
        await context.database.guilds.setSetting(context.channel.guild.id, 'prefix', prefixes);
        return this.success('The prefix has been removed!');
    }
}
