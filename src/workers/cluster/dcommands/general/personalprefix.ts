import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { MessageOptions } from 'discord.js';

export class PersonalPrefixCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'personalprefix',
            aliases: ['pprefix'],
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: 'add {prefix}',
                    description: 'Adds a command prefix just for you!',
                    execute: (ctx, [prefix]) => this.addPrefix(ctx, prefix)
                },
                {
                    parameters: 'remove {prefix}',
                    description: 'Removes one of your personal command prefixes',
                    execute: (ctx, [prefix]) => this.removePrefix(ctx, prefix)
                },
                {
                    parameters: '',
                    description: 'Lists the your personal command prefixes',
                    execute: (ctx) => this.listPrefixes(ctx)
                }
            ]
        });
    }

    public async listPrefixes(context: CommandContext): Promise<string | MessageOptions> {
        const prefixes = await context.database.users.getSetting(context.author.id, 'prefixes');
        if (prefixes === undefined || prefixes.length === 0)
            return this.info('You dont have any personal command prefixes set!');

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.author),
                    title: 'Personal prefixes',
                    description: prefixes.map(p => ` - ${p}`).join('\n')
                }
            ]
        };
    }

    public async addPrefix(context: CommandContext, prefix: string): Promise<string> {
        if (!await context.database.users.addPrefix(context.author.id, prefix.toLowerCase()))
            return this.error('You already have that as a command prefix.');
        return this.success('Your personal command prefix has been added.');
    }

    public async removePrefix(context: CommandContext, prefix: string): Promise<string> {
        if (!await context.database.users.removePrefix(context.author.id, prefix.toLowerCase()))
            return this.error('That isnt one of your prefixes.');
        return this.success('Your personal command prefix has been removed.');
    }
}
