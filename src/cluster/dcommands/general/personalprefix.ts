import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { EmbedOptions } from 'eris';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.personalPrefix;

export class PersonalPrefixCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `personalprefix`,
            aliases: [`pprefix`],
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `add {prefix}`,
                    description: cmd.add.description,
                    execute: (ctx, [prefix]) => this.addPrefix(ctx, prefix.asString)
                },
                {
                    parameters: `remove {prefix}`,
                    description: cmd.remove.description,
                    execute: (ctx, [prefix]) => this.removePrefix(ctx, prefix.asString)
                },
                {
                    parameters: ``,
                    description: cmd.list.description,
                    execute: (ctx) => this.listPrefixes(ctx)
                }
            ]
        });
    }

    public async listPrefixes(context: CommandContext): Promise<CommandResult> {
        const prefixes = await context.database.users.getSetting(context.author.id, `prefixes`);
        if (prefixes === undefined || prefixes.length === 0)
            return `ℹ️ You dont have any personal command prefixes set!`;

        return {
            author: context.util.embedifyAuthor(context.author),
            title: `Personal prefixes`,
            description: prefixes.map(p => ` - ${p}`).join(`\n`)
        };
    }

    public async addPrefix(context: CommandContext, prefix: string): Promise<CommandResult> {
        if (!await context.database.users.addPrefix(context.author.id, prefix.toLowerCase()))
            return `❌ You already have that as a command prefix.`;
        return `✅ Your personal command prefix has been added.`;
    }

    public async removePrefix(context: CommandContext, prefix: string): Promise<CommandResult> {
        if (!await context.database.users.removePrefix(context.author.id, prefix.toLowerCase()))
            return `❌ That isnt one of your prefixes.`;
        return `✅ Your personal command prefix has been removed.`;
    }
}
