import { CommandContext, GlobalCommand } from '../../command/index.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.personalPrefix;

export class PersonalPrefixCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'personalprefix',
            aliases: ['pprefix'],
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: 'add {prefix}',
                    description: cmd.add.description,
                    execute: (ctx, [prefix]) => this.addPrefix(ctx, prefix.asString)
                },
                {
                    parameters: 'remove {prefix}',
                    description: cmd.remove.description,
                    execute: (ctx, [prefix]) => this.removePrefix(ctx, prefix.asString)
                },
                {
                    parameters: '',
                    description: cmd.list.description,
                    execute: (ctx) => this.listPrefixes(ctx)
                }
            ]
        });
    }

    public async listPrefixes(context: CommandContext): Promise<CommandResult> {
        const prefixes = await context.database.users.getProp(context.author.id, 'prefixes');
        if (prefixes === undefined || prefixes.length === 0)
            return cmd.list.none;

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.author),
                    title: cmd.list.embed.title,
                    description: cmd.list.embed.description({ prefixes })
                }
            ]
        };
    }

    public async addPrefix(context: CommandContext, prefix: string): Promise<CommandResult> {
        if (!await context.database.users.addPrefix(context.author.id, prefix.toLowerCase()))
            return cmd.add.alreadyAdded;
        return cmd.add.success;
    }

    public async removePrefix(context: CommandContext, prefix: string): Promise<CommandResult> {
        if (!await context.database.users.removePrefix(context.author.id, prefix.toLowerCase()))
            return cmd.remove.notAdded;
        return cmd.remove.success;
    }
}
