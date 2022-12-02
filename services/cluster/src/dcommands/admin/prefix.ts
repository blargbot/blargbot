import { GuildCommand } from '../../command/index.js';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';

import templates from '../../text.js';

const cmd = templates.commands.prefix;

export class PrefixCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'prefix',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '',
                    description: cmd.list.description,
                    execute: ctx => this.listPrefixes(ctx)
                },
                {
                    parameters: 'add|set|create {prefix}',
                    description: cmd.add.description,
                    execute: (ctx, [prefix]) => this.addPrefix(ctx, prefix.asString)
                },
                {
                    parameters: 'remove|delete {prefix}',
                    description: cmd.remove.description,
                    execute: (ctx, [prefix]) => this.removePrefix(ctx, prefix.asString)
                }
            ]
        });
    }

    public async listPrefixes(context: GuildCommandContext): Promise<CommandResult> {
        let prefixes = await context.database.guilds.getSetting(context.channel.guild.id, 'prefix') ?? [];
        if (typeof prefixes === 'string')
            prefixes = [prefixes];

        return cmd.list.success({ guild: context.channel.guild, prefixes });
    }

    public async addPrefix(context: GuildCommandContext, prefix: string): Promise<CommandResult> {
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
        return cmd.add.success;
    }

    public async removePrefix(context: GuildCommandContext, prefix: string): Promise<CommandResult> {
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
        return cmd.remove.success;
    }
}
