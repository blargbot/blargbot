import { EmbedOptions, GuildChannel, MessageFile } from 'eris';
import moment from 'moment';
import { Duration } from 'moment-timezone';
import { Cluster } from '../cluster';
import { SendPayload } from '../core/BaseUtilities';
import { getDocsEmbed, limits } from '../core/bbtag';
import { BaseCommand, CommandContext } from '../core/command';
import { NamedStoredGuildCommand } from '../core/database';
import { bbtagUtil, codeBlock, commandTypes, guard, humanize, parse } from '../utils';

export class CustomCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'ccommand',
            aliases: ['cc'],
            category: commandTypes.ADMIN,
            info: 'Creates a custom command, using the BBTag language.\n\n'
                + 'Custom commands take precedent over all other commands. As such, you can use it to overwrite commands, or '
                + 'disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output '
                + 'whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the \'ccommand\' command. '
                + 'For more in-depth command customization, see the `editcommand` command.\n'
                + `For more information about BBTag, visit <${cluster.util.websiteLink('/tags')}>.\n`
                + `By creating a custom command, you acknowledge that you agree to the Terms of Service (<${cluster.util.websiteLink('/tags/tos')}>)`,
            definition: {
                subcommands: {
                    'test|eval|exec|vtest': {
                        parameters: 'debug? {code+}',
                        execute: (ctx, [debug]) => this.runRaw(ctx, ctx.argRange(debug === undefined ? 1 : 2, true), '', debug !== undefined),
                        description: 'Uses the BBTag engine to execute the content as if it was a custom command'
                    },
                    'docs': {
                        parameters: '{topic*}',
                        execute: (ctx, [topic]) => this.showDocs(ctx, topic),
                        description: 'Returns helpful information about the specified topic.'
                    },
                    'debug': {
                        parameters: '{commandName} {args*}',
                        execute: (ctx, [commandName]) => this.runCommand(ctx, commandName, ctx.argRange(2, true), true),
                        description: 'Runs a custom command with some arguments. A debug file will be sent in a DM after the command has finished.'
                    },
                    'create|add': {
                        parameters: '{commandName?} {content*}',
                        execute: (ctx, [commandName]) => this.createCommand(ctx, commandName, ctx.argRange(2, true)),
                        description: 'Creates a new custom command with the content you give'
                    },
                    'edit': {
                        parameters: '{commandName?} {content*}',
                        execute: (ctx, [commandName]) => this.editCommand(ctx, commandName, ctx.argRange(2, true)),
                        description: 'Edits an existing custom command to have the content you specify'
                    },
                    'set': {
                        parameters: '{commandName?} {content*}',
                        execute: (ctx, [commandName]) => this.setCommand(ctx, commandName, ctx.argRange(2, true)),
                        description: 'Sets the custom command to have the content you specify. If the custom command doesnt exist it will be created.'
                    },
                    'delete|remove': {
                        parameters: '{commandName?}',
                        execute: (ctx, [commandName]) => this.deleteCommand(ctx, commandName),
                        description: 'Deletes an existing custom command'
                    },
                    'rename': {
                        parameters: '{oldName?} {newName?}',
                        execute: (ctx, [oldName, newName]) => this.renameCommand(ctx, oldName, newName),
                        description: 'Renames the custom command'
                    },
                    'raw': {
                        parameters: '{commandName?}',
                        execute: (ctx, [commandName]) => this.getRawCommand(ctx, commandName),
                        description: 'Gets the raw content of the custom command'
                    },
                    'list': {
                        parameters: '',
                        execute: (ctx) => this.listCommands(ctx),
                        description: 'Lists all custom commands on this server'
                    },
                    'cooldown': {
                        parameters: '{commandName} {duration?:duration}',
                        execute: (ctx, [commandName, duration]) => this.setCommandCooldown(ctx, commandName, duration),
                        description: 'Sets the cooldown of a custom command, in milliseconds'
                    },
                    'author': {
                        parameters: '{commandName?}',
                        execute: (ctx, [commandName]) => this.getCommandAuthor(ctx, commandName),
                        description: 'Displays the name of the custom command\'s author'
                    },
                    'flag|flags': {
                        parameters: '{commandName}',
                        execute: (ctx, [commandName]) => this.getCommandFlags(ctx, commandName),
                        description: 'Lists the flags the custom command accepts',
                        subcommands: {
                            'create|add': {
                                parameters: '{commandName} {flags+}',
                                execute: (ctx, [commandName, flags]) => this.addCommandFlags(ctx, commandName, flags),
                                description: 'Adds multiple flags to your custom command. Flags should be of the form `-<f> <flag> [flag description]`\n' +
                                    'e.g. `b!cc flags add myCommand -c category The category you want to use -n name Your name`'
                            },
                            'delete|remove': {
                                parameters: '{commandName} {flags+}',
                                execute: (ctx, [commandName, flags]) => this.removeCommandFlags(ctx, commandName, flags),
                                description: 'Removes multiple flags from your custom command. Flags should be of the form `-<f>`\n' +
                                    'e.g. `b!cc flags remove myCommand -c -n`'
                            }
                        }
                    },
                    'setlang': {
                        parameters: '{commandName} {language}',
                        execute: (ctx, [commandName, language]) => this.setCommandLanguage(ctx, commandName, language),
                        description: 'Sets the language to use when returning the raw text of your custom command'
                    }
                }
            }
        });
    }

    public async runRaw(
        context: CommandContext,
        content: string,
        input: string,
        debug: boolean
    ): Promise<string | { content: string, files: MessageFile } | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const args = humanize.smartSplit(input);
        const result = await this.cluster.bbtag.execute(content, {
            message: context.message,
            input: args,
            isCC: true,
            limit: new limits.CustomCommandLimit(),
            tagName: 'test',
            author: context.author.id
        });

        return debug ? bbtagUtil.createDebugOutput('test', content, args, result) : undefined;
    }

    private showDocs(ctx: CommandContext, topic: readonly string[]): SendPayload | string {
        const embed = getDocsEmbed(ctx, topic);
        if (!embed)
            return `❌ Oops, I didnt recognise that topic! Try using \`${ctx.prefix}${ctx.commandName} docs\` for a list of all topics`;

        return { embed: embed, isHelp: true };
    }
    public async runCommand(
        context: CommandContext,
        commandName: string,
        input: string,
        debug: boolean
    ): Promise<string | { content: string, files: MessageFile } | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestReadableCommand(context, commandName, false);
        if (typeof match !== 'object')
            return match;

        if (debug && match.author !== context.author.id)
            return '❌ You cannot debug someone elses custom command.';

        const args = humanize.smartSplit(input);
        const result = await this.cluster.bbtag.execute(match.content, {
            message: context.message,
            input: args,
            isCC: true,
            limit: new limits.CustomCommandLimit(),
            tagName: match.name,
            author: match.author,
            authorizer: match.authorizer,
            flags: match.flags,
            cooldown: match.cooldown
        });

        return debug ? bbtagUtil.createDebugOutput(match.name, match.content, args, result) : undefined;
    }

    public async createCommand(context: CommandContext, commandName: string | undefined, content: string | undefined): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestCreatableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        return await this.saveCommand(context, 'created', match.name, content);
    }

    public async editCommand(context: CommandContext, commandName: string | undefined, content: string | undefined): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        return await this.saveCommand(context, 'edited', match.name, content, match);
    }

    public async deleteCommand(context: CommandContext, commandName: string | undefined): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        await this.database.guilds.setCommand(context.channel.guild.id, match.name, undefined);
        return `✅ The \`${match.name}\` custom command is gone forever!`;
    }

    public async setCommand(context: CommandContext, commandName: string | undefined, content: string | undefined): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestSettableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        return await this.saveCommand(context, 'set', match.name, content, match.command);
    }

    public async renameCommand(context: CommandContext, oldName: string | undefined, newName: string | undefined): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const from = await this.requestEditableCommand(context, oldName);
        if (typeof from !== 'object')
            return from;

        const to = await this.requestCreatableCommand(context, newName);
        if (typeof to !== 'object')
            return to;

        await this.database.guilds.renameCommand(context.channel.guild.id, from.name, to.name);

        return `✅ The \`${from.name}\` custom command has been renamed to \`${to.name}\`.`;
    }

    public async getRawCommand(context: CommandContext, commandName: string | undefined): Promise<string | { content: string, files: MessageFile } | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestReadableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        const response = `The raw code for \`${match.name}\` is:\n\`\`\`${match.lang}\n${match.content}\n\`\`\``;
        return response.length < 2000
            ? response
            : {
                content: `The raw code for \`${match.name}\` is attached`,
                files: {
                    name: match.name + '.bbtag',
                    file: match.content
                }
            };
    }

    public async listCommands(context: CommandContext): Promise<{ embed: EmbedOptions } | string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const grouped: Record<string, string[]> = {};
        for (const command of await this.database.guilds.listCommands(context.channel.guild.id)) {
            const roles = command.roles === undefined || command.roles.length === 0 ? ['All Roles'] : command.roles;
            for (const role of roles) {
                (grouped[role] ??= []).push(command.name);
            }
        }
        return {
            embed: {
                title: 'List of custom commands',
                color: 0x7289da,
                fields: Object.entries(grouped)
                    .map(([role, commands]) => ({
                        name: role,
                        value: codeBlock(commands.join(', '), 'ini'),
                        inline: true
                    }))
            }
        };
    }

    public async setCommandCooldown(context: CommandContext, commandName: string, cooldown?: Duration): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        if (cooldown !== undefined && cooldown.asMilliseconds() < 0)
            return '❌ The cooldown must be greater than 0ms';

        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        await this.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'cooldown', cooldown?.asMilliseconds());
        cooldown ??= moment.duration();
        return `✅ The custom command \`${match.name}\` now has a cooldown of \`${humanize.duration(cooldown)}\`.`;
    }

    public async getCommandAuthor(context: CommandContext, commandName: string | undefined): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestReadableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        const response = [];
        const author = await this.database.users.get(match.author);
        response.push(`✅ The custom command \`${match.name}\` was made by **${humanize.fullName(author)}**`);
        if (match.authorizer !== undefined && match.authorizer !== match.author) {
            const authorizer = await this.database.users.get(match.authorizer);
            response.push(`and is authorized by **${humanize.fullName(authorizer)}**`);
        }

        return response.join(' ');
    }

    public async getCommandFlags(context: CommandContext, commandName: string): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestReadableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        const flags = humanize.flags(match.flags ?? []);
        if (flags.length === 0)
            return `❌ The \`${match.name}\` custom command has no flags.`;

        return `✅ The \`${match.name}\` custom command has the following flags:\n\n${flags.join('\n')}`;
    }

    public async addCommandFlags(context: CommandContext, commandName: string, flagsRaw: string[]): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { undefined: _, ...addFlags } = parse.flags([], flagsRaw);
        const flags = [...(match.flags ?? [])];
        for (const flag of Object.keys(addFlags)) {
            const args = addFlags[flag];
            if (args === undefined || args.length === 0)
                return `❌ No word was specified for the \`${flag}\` flag`;

            if (flags.some(f => f.flag === flag))
                return `❌ The flag \`${flag}\` already exists!`;

            const word = args[0].replace(/[^a-z]/g, '').toLowerCase();
            if (flags.some(f => f.word === word))
                return `❌ A flag with the word \`${word}\` already exists!`;

            const desc = args.slice(1).join(' ').replace(/\n/g, ' ');
            flags.push({ flag, word, desc });
        }

        await this.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'flags', flags);
        return `✅ The flags for \`${match.name}\` have been updated.`;
    }

    public async removeCommandFlags(context: CommandContext, commandName: string, flagsRaw: string[]): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { undefined: _, ...removeFlags } = parse.flags([], flagsRaw);
        const flags = [...(match.flags ?? [])]
            .filter(f => removeFlags[f.flag] === undefined);

        await this.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'flags', flags);
        return `✅ The flags for \`${match.name}\` have been updated.`;
    }

    public async setCommandLanguage(context: CommandContext, commandName: string, language: string): Promise<string | undefined> {
        if (!guard.isGuildCommandContext(context))
            return '❌ Custom commands can only be used on guilds.';

        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        await this.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'lang', language);
        return `✅ Lang for custom command \`${match.name}\` set.`;
    }

    private async saveCommand(
        context: CommandContext<GuildChannel>,
        operation: string,
        commandName: string,
        content: string | undefined,
        currentCommand?: NamedStoredGuildCommand
    ): Promise<string | undefined> {
        content = await this.requestCommandContent(context, content);
        if (content === undefined)
            return;

        const analysis = this.cluster.bbtag.check(content);
        if (analysis.errors.length > 0)
            return `❌ There were errors with the bbtag you provided!\n${bbtagUtil.stringifyAnalysis(analysis)}`;

        const command = {
            content: content,
            author: context.author.id,
            authorizer: context.author.id,
            hidden: currentCommand?.hidden ?? commandName.startsWith('_'),
            flags: currentCommand?.flags,
            alias: currentCommand?.alias,
            cooldown: currentCommand?.cooldown,
            help: currentCommand?.help,
            lang: currentCommand?.lang,
            roles: currentCommand?.roles,
            uses: currentCommand?.uses
        };

        await this.database.guilds.setCommand(context.channel.guild.id, commandName, command);

        return `✅ Custom command \`${commandName}\` ${operation}.\n${bbtagUtil.stringifyAnalysis(analysis)}`;
    }
    private async requestCommandName(
        context: CommandContext<GuildChannel>,
        name: string | undefined,
        query = 'Enter the name of the custom command or type `c` to cancel:'
    ): Promise<string | undefined> {
        if (name !== undefined) {
            name = normalizeName(name);
            if (name.length > 0)
                return name;
        }

        if (query.length === 0)
            return undefined;

        name = (await this.util.awaitQuery(context.channel, context.author, query))?.content;
        if (name === undefined || name === 'c')
            return undefined;

        name = normalizeName(name);
        return name.length > 0 ? name : undefined;
    }

    private async requestCommandContent(
        context: CommandContext<GuildChannel>,
        content: string | undefined
    ): Promise<string | undefined> {
        if (content !== undefined && content.length > 0)
            return content;

        content = (await this.util.awaitQuery(context.channel, context.author, 'Enter the custom command\'s contents or type `c` to cancel:'))?.content;
        if (content === undefined || content === 'c')
            return undefined;

        return content.length > 0 ? content : undefined;
    }

    private async requestSettableCommand(
        context: CommandContext<GuildChannel>,
        commandName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string, command?: NamedStoredGuildCommand } | string | undefined> {
        const match = await this.requestCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        return { name: match.name, command: match.command };
    }

    private async requestEditableCommand(
        context: CommandContext<GuildChannel>,
        commandName: string | undefined,
        allowQuery = true
    ): Promise<NamedStoredGuildCommand | string | undefined> {
        const match = await this.requestSettableCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.command === undefined)
            return `❌ The \`${match.name}\` custom command doesn\'t exist!`;

        return match.command;
    }

    private async requestReadableCommand(
        context: CommandContext<GuildChannel>,
        commandName: string | undefined,
        allowQuery = true
    ): Promise<NamedStoredGuildCommand | string | undefined> {
        const match = await this.requestCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.command === undefined)
            return `❌ The \`${match.name}\` custom command doesn\'t exist!`;

        return match.command;
    }

    private async requestCreatableCommand(
        context: CommandContext<GuildChannel>,
        commandName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string } | string | undefined> {
        const match = await this.requestCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.command !== undefined)
            return `❌ The \`${match.name}\` custom command already exists!`;

        return { name: match.name };
    }

    private async requestCommand(
        context: CommandContext<GuildChannel>,
        commandName: string | undefined,
        allowQuery: boolean
    ): Promise<{ name: string, command?: NamedStoredGuildCommand } | string | undefined> {
        commandName = await this.requestCommandName(context, commandName, allowQuery ? undefined : '');
        if (commandName === undefined)
            return;

        const command = await this.database.guilds.getCommand(context.channel.guild.id, commandName);
        if (command === undefined)
            return { name: commandName };

        return { name: command.name, command };
    }
}

function normalizeName(title: string): string {
    return title.replace(/[^\d\w .,\/#!$%\^&\*;:{}[\]=\-_~()<>]/gi, '').toLowerCase();
}