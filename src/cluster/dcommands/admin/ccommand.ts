import { bbtag } from '@blargbot/bbtag';
import { Cluster } from '@blargbot/cluster';
import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, CustomCommandShrinkwrap, GuildCommandContext, GuildShrinkwrap, ICommand, SignedGuildShrinkwrap } from '@blargbot/cluster/types';
import { codeBlock, CommandType, getBBTagDocsEmbed, guard, humanize, parse } from '@blargbot/cluster/utils';
import { Configuration } from '@blargbot/config';
import { SendContent, SendPayload } from '@blargbot/core/types';
import { FlagDefinition, NamedGuildCommandTag, NamedGuildSourceCommandTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';
import { createHmac } from 'crypto';
import { EmbedOptions, FileContent, Role } from 'eris';
import moment, { Duration } from 'moment-timezone';
import fetch from 'node-fetch';

export class CustomCommandCommand extends GuildCommand {
    public static readonly reservedCommandNames = new Set<string>(['ccommand', 'editcommand']);

    public constructor(cluster: Cluster) {
        super({
            name: 'ccommand',
            aliases: ['cc'],
            category: CommandType.ADMIN,
            description: 'Creates a custom command, using the BBTag language.\n\n'
                + 'Custom commands take precedent over all other commands. As such, you can use it to overwrite commands, or '
                + 'disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output '
                + 'whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the \'ccommand\' command. '
                + 'For more in-depth command customization, see the `editcommand` command.\n'
                + `For more information about BBTag, visit <${cluster.util.websiteLink('/bbtag/subtags')}>.\n`
                + `By creating a custom command, you acknowledge that you agree to the Terms of Service (<${cluster.util.websiteLink('/bbtag/subtags/tos')}>)`,
            definitions: [
                {
                    parameters: 'test|eval|exec|vtest',
                    subcommands: [
                        {
                            parameters: '{~code+}',
                            execute: (ctx, [code]) => this.runRaw(ctx, code.asString, '', false),
                            description: 'Uses the BBTag engine to execute the content as if it was a custom command'
                        },
                        {
                            parameters: 'debug {~code+}',
                            execute: (ctx, [code]) => this.runRaw(ctx, code.asString, '', true),
                            description: 'Uses the BBTag engine to execute the content as if it was a custom command and will return the debug output'
                        }
                    ]
                },
                {
                    parameters: 'docs {topic+?}',
                    execute: (ctx, [topic]) => this.showDocs(ctx, topic.asOptionalString),
                    description: 'Returns helpful information about the specified topic.'
                },
                {
                    parameters: 'debug {commandName} {~args+?}',
                    execute: (ctx, [commandName, args]) => this.runCommand(ctx, commandName.asString, args.asOptionalString, true),
                    description: 'Runs a custom command with some arguments. A debug file will be sent in a DM after the command has finished.'
                },
                {
                    parameters: 'create|add {commandName?} {~content+?}',
                    execute: (ctx, [commandName, content]) => this.createCommand(ctx, commandName.asOptionalString, content.asOptionalString),
                    description: 'Creates a new custom command with the content you give'
                },
                {
                    parameters: 'edit {commandName?} {~content+?}',
                    execute: (ctx, [commandName, content]) => this.editCommand(ctx, commandName.asOptionalString, content.asOptionalString),
                    description: 'Edits an existing custom command to have the content you specify'
                },
                {
                    parameters: 'set {commandName?} {~content+?}',
                    execute: (ctx, [commandName, content]) => this.setCommand(ctx, commandName.asOptionalString, content.asOptionalString),
                    description: 'Sets the custom command to have the content you specify. If the custom command doesnt exist it will be created.'
                },
                {
                    parameters: 'delete|remove {commandName?}',
                    execute: (ctx, [commandName]) => this.deleteCommand(ctx, commandName.asOptionalString),
                    description: 'Deletes an existing custom command'
                },
                {
                    parameters: 'rename {oldName?} {newName?}',
                    execute: (ctx, [oldName, newName]) => this.renameCommand(ctx, oldName.asOptionalString, newName.asOptionalString),
                    description: 'Renames the custom command'
                },
                {
                    parameters: 'raw {commandName?}',
                    execute: (ctx, [commandName]) => this.getRawCommand(ctx, commandName.asOptionalString),
                    description: 'Gets the raw content of the custom command'
                },
                {
                    parameters: 'list ',
                    execute: (ctx) => this.listCommands(ctx),
                    description: 'Lists all custom commands on this server'
                },
                {
                    parameters: 'cooldown {commandName} {duration:duration+=0ms}',
                    execute: (ctx, [commandName, duration]) => this.setCommandCooldown(ctx, commandName.asString, duration.asDuration),
                    description: 'Sets the cooldown of a custom command, in milliseconds'
                },
                {
                    parameters: 'author {commandName?}',
                    execute: (ctx, [commandName]) => this.getCommandAuthor(ctx, commandName.asString),
                    description: 'Displays the name of the custom command\'s author'
                },
                {
                    parameters: 'flag|flags',
                    subcommands: [
                        {
                            parameters: '{commandName}',
                            execute: (ctx, [commandName]) => this.getCommandFlags(ctx, commandName.asString),
                            description: 'Lists the flags the custom command accepts'
                        },
                        {
                            parameters: 'create|add {commandName} {~flags+}',
                            execute: (ctx, [commandName, flags]) => this.addCommandFlags(ctx, commandName.asString, flags.asString),
                            description: 'Adds multiple flags to your custom command. Flags should be of the form `-<f> <flag> [flag description]`\n' +
                                'e.g. `b!cc flags add myCommand -c category The category you want to use -n name Your name`'
                        },
                        {
                            parameters: 'delete|remove {commandName} {~flags+}',
                            execute: (ctx, [commandName, flags]) => this.removeCommandFlags(ctx, commandName.asString, flags.asString),
                            description: 'Removes multiple flags from your custom command. Flags should be of the form `-<f>`\n' +
                                'e.g. `b!cc flags remove myCommand -c -n`'
                        }
                    ]
                },
                {
                    parameters: 'sethelp {commandName} {~helpText+?}',
                    execute: (ctx, [commandName, helpText]) => this.setCommandHelp(ctx, commandName.asString, helpText.asOptionalString),
                    description: 'Sets the help text to show for the command'
                },
                {
                    parameters: 'hide {commandName}',
                    execute: (ctx, [commandName]) => this.toggleCommandHidden(ctx, commandName.asString),
                    description: 'Toggles whether the command is hidden from the command list or not'
                },
                {
                    parameters: 'setRole {commandName} {roles:role[0]}',
                    execute: (ctx, [commandName, roles]) => this.setCommandRoles(ctx, commandName.asString, roles.asRoles),
                    description: 'Sets the roles that are allowed to use the command'
                },
                {
                    parameters: 'shrinkwrap {commandNames[]}',
                    execute: (ctx, [commandNames]) => this.shrinkwrapCommands(ctx, commandNames.asStrings),
                    description: 'Bundles up the given commands into a single file that you can download and install into another server'
                },
                {
                    parameters: 'install {shrinkwrapUrl?}',
                    execute: (ctx, [shrinkwrapUrl]) => this.installCommands(ctx, shrinkwrapUrl.asOptionalString),
                    description: 'Bundles up the given commands into a single file that you can download and install into another server'
                },
                {
                    parameters: 'import {tagName} {commandName?}',
                    execute: (ctx, [tagName, commandName]) => this.importCommand(ctx, tagName.asString, commandName.asOptionalString ?? tagName.asString),
                    description: 'Imports a tag as a ccommand, retaining all data such as author variables'
                }
            ]
        });
    }

    public async runRaw(
        context: GuildCommandContext,
        content: string,
        input: string,
        debug: boolean
    ): Promise<string | SendContent | undefined> {
        const result = await context.bbtag.execute(content, {
            message: context.message,
            inputRaw: input,
            isCC: true,
            limit: 'customCommandLimit',
            rootTagName: 'test',
            authorId: context.author.id
        });

        if (!debug)
            return undefined;

        await context.sendDM(bbtag.createDebugOutput(result));
        return this.info('Ive sent the debug output in a DM');
    }

    public async showDocs(context: GuildCommandContext, topic: string | undefined): Promise<SendPayload | string> {
        const embed = await getBBTagDocsEmbed(context, topic);
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}${context.commandName} docs\` for a list of all topics`);
        if (typeof embed === 'string')
            return embed;
        return { embeds: [embed], isHelp: true };
    }

    public async runCommand(
        context: GuildCommandContext,
        commandName: string,
        input: string | undefined,
        debug: boolean
    ): Promise<string | SendContent | undefined> {
        const match = await this.requestReadableCommand(context, commandName, false);
        if (typeof match !== 'object')
            return match;

        if (debug && match.author !== context.author.id)
            return this.error('You cannot debug someone elses custom command.');

        if (guard.isGuildImportedCommandTag(match))
            return this.error(`The command \`${commandName}\` is an alias to the tag \`${match.alias}\``);

        const result = await context.bbtag.execute(match.content, {
            message: context.message,
            inputRaw: input ?? '',
            isCC: true,
            limit: 'customCommandLimit',
            rootTagName: match.name,
            authorId: match.author,
            authorizerId: match.authorizer,
            flags: match.flags,
            cooldown: match.cooldown
        });

        if (!debug)
            return undefined;

        await context.sendDM(bbtag.createDebugOutput(result));
        return this.info('Ive sent the debug output in a DM');
    }

    public async createCommand(context: GuildCommandContext, commandName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestCreatableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        return await this.saveCommand(context, 'created', match.name, content);
    }

    public async editCommand(context: GuildCommandContext, commandName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        if (guard.isGuildImportedCommandTag(match))
            return this.error(`The \`${match.name}\` custom command is an alias to the tag \`${match.alias}\``);

        return await this.saveCommand(context, 'edited', match.name, content, match);
    }

    public async deleteCommand(context: GuildCommandContext, commandName: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        await context.database.guilds.setCommand(context.channel.guild.id, match.name, undefined);
        return this.success(`The \`${match.name}\` custom command is gone forever!`);
    }

    public async setCommand(context: GuildCommandContext, commandName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestSettableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        if (guard.isGuildImportedCommandTag(match.command))
            return this.error(`The \`${match.name}\` custom command is an alias to the tag \`${match.command.alias}\``);

        return await this.saveCommand(context, 'set', match.name, content, match.command);
    }

    public async renameCommand(context: GuildCommandContext, oldName: string | undefined, newName: string | undefined): Promise<string | undefined> {
        const from = await this.requestEditableCommand(context, oldName);
        if (typeof from !== 'object')
            return from;

        const to = await this.requestCreatableCommand(context, newName);
        if (typeof to !== 'object')
            return to;

        await context.database.guilds.renameCommand(context.channel.guild.id, from.name, to.name);

        return this.success(`The \`${from.name}\` custom command has been renamed to \`${to.name}\`.`);
    }

    public async getRawCommand(context: GuildCommandContext, commandName: string | undefined): Promise<string | { content: string; files: FileContent[]; } | undefined> {
        const match = await this.requestReadableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        if (guard.isGuildImportedCommandTag(match))
            return this.error(`The command \`${match.name}\` is an alias to the tag \`${match.alias}\``);

        const response = this.info(`The raw code for \`${match.name}\` is:\n${codeBlock(match.content)}`);
        return guard.checkMessageSize(response)
            ? response
            : {
                content: this.info(`The raw code for \`${match.name}\` is attached`),
                files: [
                    {
                        name: match.name + '.bbtag',
                        file: match.content
                    }
                ]
            };
    }

    public async listCommands(context: GuildCommandContext): Promise<{ embeds: [EmbedOptions]; } | string | undefined> {
        const grouped: Record<string, string[]> = {};
        for await (const command of context.cluster.commands.custom.list(context.channel.guild)) {
            for await (const role of this.getRoles(context, command)) {
                (grouped[role] ??= []).push(command.name);
            }
        }
        return {
            embeds: [
                {
                    title: 'List of custom commands',
                    color: 0x7289da,
                    fields: Object.entries(grouped)
                        .map(([role, commands]) => ({
                            name: role,
                            value: codeBlock(commands.join(', '), 'ini'),
                            inline: true
                        }))
                }
            ]
        };
    }

    private async * getRoles(context: GuildCommandContext, command: ICommand): AsyncGenerator<string> {
        if (command.roles.length === 0)
            yield 'All Roles';

        if (guard.isGuildCommandContext(context)) {
            for (const roleStr of command.roles) {
                const role = await context.util.getRole(context.channel.guild, roleStr)
                    ?? context.channel.guild.roles.find(r => r.name.toLowerCase() === roleStr.toLowerCase());

                if (role !== undefined)
                    yield role.name;
            }
        }
    }

    public async setCommandCooldown(context: GuildCommandContext, commandName: string, cooldown?: Duration): Promise<string | undefined> {
        if (cooldown !== undefined && cooldown.asMilliseconds() < 0)
            return this.error('The cooldown must be greater than 0ms');

        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'cooldown', cooldown?.asMilliseconds());
        cooldown ??= moment.duration();
        return this.success(`The custom command \`${match.name}\` now has a cooldown of \`${humanize.duration(cooldown)}\`.`);
    }

    public async getCommandAuthor(context: GuildCommandContext, commandName: string | undefined): Promise<string | undefined> {
        const match = await this.requestReadableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        const response = [];
        const author = await context.database.users.get(match.author);
        response.push(this.success(`The custom command \`${match.name}\` was made by **${humanize.fullName(author)}**`));
        if (match.authorizer !== undefined && match.authorizer !== match.author) {
            const authorizer = await context.database.users.get(match.authorizer);
            response.push(`and is authorized by **${humanize.fullName(authorizer)}**`);
        }

        return response.join(' ');
    }

    public async getCommandFlags(context: GuildCommandContext, commandName: string): Promise<string | undefined> {
        const match = await this.requestReadableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        const flagDefinitions = guard.isGuildImportedCommandTag(match)
            ? (await context.database.tags.get(match.alias))?.flags ?? []
            : match.flags ?? [];

        const flags = humanize.flags(flagDefinitions);
        if (flags.length === 0)
            return this.error(`The \`${match.name}\` custom command has no flags.`);

        return this.success(`The \`${match.name}\` custom command has the following flags:\n\n${flags.join('\n')}`);
    }

    public async addCommandFlags(context: GuildCommandContext, commandName: string, flagsRaw: string): Promise<string | undefined> {
        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        if (guard.isGuildImportedCommandTag(match))
            return this.error(`The \`${commandName}\` custom command is an alias to the tag \`${match.alias}\``);

        const { _, ...addFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []];
        for (const [flag, args] of Object.entries(addFlags)) {
            if (args === undefined || args.length === 0)
                return this.error(`No word was specified for the \`${flag}\` flag`);

            if (flags.some(f => f.flag === flag))
                return this.error(`The flag \`${flag}\` already exists!`);

            const word = args.get(0)?.value.replace(/[^a-z]/g, '').toLowerCase() ?? '';
            if (flags.some(f => f.word === word))
                return this.error(`A flag with the word \`${word}\` already exists!`);

            const description = args.slice(1).merge().value.replace(/\n/g, ' ');
            flags.push({ flag, word, description });
        }

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'flags', flags);
        return this.success(`The flags for \`${match.name}\` have been updated.`);
    }

    public async removeCommandFlags(context: GuildCommandContext, commandName: string, flagsRaw: string): Promise<string | undefined> {
        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        if (guard.isGuildImportedCommandTag(match))
            return this.error(`The \`${commandName}\` custom command is an alias to the tag \`${match.alias}\``);

        const { _, ...removeFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []]
            .filter(f => removeFlags[f.flag] === undefined);

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'flags', flags);
        return this.success(`The flags for \`${match.name}\` have been updated.`);
    }

    public async setCommandHelp(context: GuildCommandContext, commandName: string, helpText: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'help', helpText);
        return this.success(`Help text for custom command \`${match.name}\` set.`);
    }

    public async toggleCommandHidden(context: GuildCommandContext, commandName: string): Promise<string | undefined> {
        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        const isNowHidden = match.hidden !== true;
        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'hidden', isNowHidden);
        return this.success(`Custom command \`${match.name}\` is now ${isNowHidden ? 'hidden' : 'visible'}.`);
    }

    public async setCommandRoles(context: GuildCommandContext, commandName: string, roles: readonly Role[]): Promise<string | undefined> {
        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'roles', roles.map(r => r.id));
        return this.success(`Roles for custom command \`${match.name}\` set to ${humanize.smartJoin(roles.map(r => `\`${r.name}\``), ', ', ' and ')}.`);
    }

    public async importCommand(context: GuildCommandContext, tagName: string, commandName: string | undefined): Promise<string | undefined> {
        commandName = await this.requestCommandName(context, commandName ?? tagName);
        if (commandName === undefined)
            return undefined;

        if (await context.database.guilds.getCommand(context.channel.guild.id, commandName) !== undefined)
            return this.error(`The \`${commandName}\` custom command already exists!`);

        const tag = await context.database.tags.get(tagName);
        if (tag === undefined)
            return this.error(`The \`${tagName}\` tag doesnt exist!`);

        const author = await context.database.users.get(tag.author);
        await context.database.guilds.setCommand(context.channel.guild.id, commandName, {
            author: tag.author,
            alias: tagName,
            authorizer: context.author.id
        });
        return this.success(`The tag \`${tag.name}\` by **${humanize.fullName(author)}** has been imported as \`${commandName}\` and is authorized by **${humanize.fullName(context.author)}**`);
    }

    public async shrinkwrapCommands(context: GuildCommandContext, commandNames: readonly string[]): Promise<CommandResult> {
        const shrinkwrap: GuildShrinkwrap = { cc: {} };
        const confirm = [
            'Salutations! You have discovered the super handy ShrinkWrapper9000!',
            '',
            'If you decide to proceed, this will:'
        ];

        const commands = new Map((await context.database.guilds.getCustomCommands(context.channel.guild.id)).map(c => [c.name, c] as const));
        for (let commandName of commandNames) {
            commandName = commandName.toLowerCase();
            const command = commands.get(commandName);
            if (command === undefined || guard.isGuildImportedCommandTag(command))
                continue;

            confirm.push(` - Export the custom command \`${commandName}\``);
        }

        confirm.push(
            'This will not:',
            ' - Export variables',
            ' - Export authors or authorizers',
            ' - Export depedencies'
        );

        const shouldExport = await context.cluster.util.queryConfirm({
            context: context.channel,
            actors: context.author,
            prompt: confirm.join('\n'),
            confirm: 'Continue',
            cancel: 'Cancel',
            fallback: false
        });

        if (!shouldExport)
            return this.success('Maybe next time then.');

        return {
            content: this.success('No problem, my job here is done.'),
            files: [
                {
                    file: JSON.stringify(<SignedGuildShrinkwrap>{
                        signature: signShrinkwrap(shrinkwrap, context.config),
                        payload: shrinkwrap
                    }, null, 2),
                    name: 'shrinkwrap.json'
                }
            ]
        };
    }

    public async installCommands(context: GuildCommandContext, shrinkwrapUrl?: string): Promise<string> {
        if (shrinkwrapUrl === undefined) {
            if (context.message.attachments.length === 0)
                return this.error('You have to upload the installation file, or give me a URL to one.');
            shrinkwrapUrl = context.message.attachments[0].url;
        }

        const content = await requestSafe(shrinkwrapUrl);
        const signedShrinkwrap = mapSignedGuildShrinkwrap(content);
        if (!signedShrinkwrap.valid)
            return this.error('Your installation file was malformed.');

        const confirm = [];
        const importSteps: Array<() => Promise<unknown>> = [];

        if (signedShrinkwrap.value.signature === undefined)
            confirm.push(this.warning('**Warning**: This installation file is **unsigned**. It did not come from me. Please double check to make sure you want to go through with this.'), '');
        else if (signedShrinkwrap.value.signature !== signShrinkwrap(signedShrinkwrap.value.payload, context.config)) {
            confirm.push(this.warning('**Warning**: This installation file\'s signature is **incorrect**. There is a 100% chance that it has been tampered with. Please double check to make sure you want to go through with this.'), '');
        }
        confirm.push(
            'Salutations! You have discovered the super handy CommandInstaller9000!',
            '',
            'If you decide to proceed, this will:'
        );

        const guildId = context.channel.guild.id;
        const commandNames = new Set((await context.database.guilds.getCustomCommands(guildId)).map(c => c.name));
        const shrinkwrap = signedShrinkwrap.value.payload;
        for (const [commandName, command] of Object.entries(shrinkwrap.cc)) {
            if (command === undefined)
                continue;

            if (commandNames.has(commandName.toLowerCase())) {
                confirm.push(this.error(`Ignore the command \`${commandName}\` as a command with that name already exists`));
                continue;
            }

            confirm.push(this.success(`Import the command \`${commandName}\``));
            importSteps.push(async () => {
                await context.cluster.database.guilds.setCommand(guildId, commandName, {
                    ...command,
                    author: context.author.id
                });
            });
        }

        confirm.push(
            'This will also:',
            ' - Set you as the author for all imported commands'
        );

        const shouldImport = await context.cluster.util.queryConfirm({
            context: context.channel,
            actors: context.author,
            prompt: confirm.join('\n'),
            confirm: 'Continue',
            cancel: 'Cancel',
            fallback: false
        });

        if (!shouldImport)
            return this.success('Maybe next time then.');

        for (const step of importSteps)
            await step();

        return this.success('No problem, my job here is done.');
    }

    private async saveCommand(
        context: GuildCommandContext,
        operation: string,
        commandName: string,
        content: string | undefined,
        currentCommand?: NamedGuildSourceCommandTag
    ): Promise<string | undefined> {
        content = await this.requestCommandContent(context, content);
        if (content === undefined)
            return;

        const analysis = context.bbtag.check(content);
        if (analysis.errors.length > 0)
            return this.error(`There were errors with the bbtag you provided!\n${bbtag.stringifyAnalysis(analysis)}`);

        const command = {
            content: content,
            author: context.author.id,
            authorizer: context.author.id,
            hidden: currentCommand?.hidden ?? commandName.startsWith('_'),
            flags: currentCommand?.flags,
            cooldown: currentCommand?.cooldown,
            help: currentCommand?.help,
            roles: currentCommand?.roles
        };

        await context.database.guilds.setCommand(context.channel.guild.id, commandName, command);

        return this.success(`Custom command \`${commandName}\` ${operation}.\n${bbtag.stringifyAnalysis(analysis)}`);
    }
    private async requestCommandName(
        context: GuildCommandContext,
        name: string | undefined,
        query = 'Enter the name of the custom command:'
    ): Promise<string | undefined> {
        if (name !== undefined) {
            name = normalizeName(name);
            if (CustomCommandCommand.reservedCommandNames.has(name)) {
                await context.reply(this.error(`The command name \`${name}\` is reserved and cannot be overwritten`));
                return undefined;
            }

            if (name.length > 0)
                return name;
        }

        if (query.length === 0)
            return undefined;

        const nameResult = await context.queryText({ prompt: query });
        if (nameResult.state !== 'SUCCESS')
            return undefined;

        name = normalizeName(nameResult.value);
        if (CustomCommandCommand.reservedCommandNames.has(name)) {
            await context.reply(this.error(`The command name \`${name}\` is reserved and cannot be overwritten`));
            return undefined;
        }
        return name.length > 0 ? name : undefined;
    }

    private async requestCommandContent(
        context: GuildCommandContext,
        content: string | undefined
    ): Promise<string | undefined> {
        if (content !== undefined && content.length > 0)
            return content;

        const contentResult = await context.queryText({ prompt: 'Enter the custom command\'s contents:' });
        if (contentResult.state !== 'SUCCESS')
            return undefined;

        return contentResult.value;
    }

    private async requestSettableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string; command?: NamedGuildCommandTag; } | string | undefined> {
        const match = await this.requestCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        return { name: match.name, command: match.command };
    }

    private async requestEditableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        { hidden = true, allowQuery = true } = {}
    ): Promise<NamedGuildCommandTag | string | undefined> {
        const match = await this.requestSettableCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.command === undefined)
            return this.error(`The \`${match.name}\` custom command doesn't exist!`);

        if (!hidden && match.command.hidden === true)
            return this.error(`The \`${match.name}\` custom command is a hidden command`);

        return match.command;
    }

    private async requestReadableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        allowQuery = true
    ): Promise<NamedGuildCommandTag | string | undefined> {
        const match = await this.requestCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.command === undefined)
            return this.error(`The \`${match.name}\` custom command doesn't exist!`);

        return match.command;
    }

    private async requestCreatableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string; } | string | undefined> {
        const match = await this.requestCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.command !== undefined)
            return this.error(`The \`${match.name}\` custom command already exists!`);

        return { name: match.name };
    }

    private async requestCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        allowQuery: boolean
    ): Promise<{ name: string; command?: NamedGuildCommandTag; } | string | undefined> {
        commandName = await this.requestCommandName(context, commandName, allowQuery ? undefined : '');
        if (commandName === undefined)
            return undefined;

        const command = await context.database.guilds.getCommand(context.channel.guild.id, commandName);
        if (command === undefined)
            return { name: commandName };

        return { name: command.name, command };
    }
}

function normalizeName(title: string): string {
    return title.replace(/[^\d\w .,/#!$%^&*;:{}[\]=\-_~()<>]/gi, '').toLowerCase();
}

function signShrinkwrap(shrinkwrap: GuildShrinkwrap, config: Configuration): string {
    const content = JSON.stringify(shrinkwrap);
    return createHmac('sha256', config.general.shrinkwrapKey).update(content).digest('hex');
}

async function requestSafe(url: string): Promise<unknown> {
    try {
        const response = await fetch(url);
        return await response.json() as unknown;
    } catch {
        return undefined;
    }
}

const mapCustomCommandShrinkwrap = mapping.object<CustomCommandShrinkwrap>({
    content: mapping.string,
    cooldown: mapping.number.optional,
    flags: mapping.array(
        mapping.object<FlagDefinition>({
            description: mapping.string,
            word: mapping.string,
            flag: mapping.in(...guard.isFlagChar.accept)
        })
    ).optional,
    help: mapping.string.optional,
    hidden: mapping.boolean.optional,
    roles: mapping.array(mapping.string).optional,
    disabled: mapping.boolean.optional,
    permission: mapping.string.optional
});

const mapGuildShrinkwrap = mapping.object<GuildShrinkwrap>({
    cc: mapping.record(mapCustomCommandShrinkwrap)
});

const mapSignedGuildShrinkwrap = mapping.object<SignedGuildShrinkwrap>({
    signature: mapping.string.optional,
    payload: mapping.choice(mapping.json(mapGuildShrinkwrap), mapGuildShrinkwrap)
});
