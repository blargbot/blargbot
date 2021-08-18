import { Cluster } from '@cluster';
import { CustomCommandLimit, getDocsEmbed } from '@cluster/bbtag';
import { BaseGuildCommand } from '@cluster/command';
import { AutoresponseShrinkwrap, CommandResult, CustomCommandShrinkwrap, FilteredAutoresponseShrinkwrap, FlagDefinition, GuildCommandContext, GuildShrinkwrap, SignedGuildShrinkwrap } from '@cluster/types';
import { bbtagUtil, codeBlock, CommandType, guard, humanize, mapping, parse } from '@cluster/utils';
import { Database } from '@core/database';
import { GuildAutoresponse, GuildFilteredAutoresponse, NamedStoredGuildCommand, NamedStoredRawGuildCommand, SendPayload } from '@core/types';
import { createHmac } from 'crypto';
import { FileOptions, MessageEmbedOptions } from 'discord.js';
import moment from 'moment';
import { Duration } from 'moment-timezone';
import fetch from 'node-fetch';

export class CustomCommand extends BaseGuildCommand {
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
                + `For more information about BBTag, visit <${cluster.util.websiteLink('/tags')}>.\n`
                + `By creating a custom command, you acknowledge that you agree to the Terms of Service (<${cluster.util.websiteLink('/tags/tos')}>)`,
            definitions: [
                {
                    parameters: 'test|eval|exec|vtest',
                    subcommands: [
                        {
                            parameters: '{~code+}',
                            execute: (ctx, [code]) => this.runRaw(ctx, code, '', false),
                            description: 'Uses the BBTag engine to execute the content as if it was a custom command'
                        },
                        {
                            parameters: 'debug {~code+}',
                            execute: (ctx, [code]) => this.runRaw(ctx, code, '', true),
                            description: 'Uses the BBTag engine to execute the content as if it was a custom command and will return the debug output'
                        }
                    ]
                },
                {
                    parameters: 'docs {topic+?}',
                    execute: (ctx, [topic]) => this.showDocs(ctx, topic),
                    description: 'Returns helpful information about the specified topic.'
                },
                {
                    parameters: 'debug {commandName} {~args+?}',
                    execute: (ctx, [commandName, args]) => this.runCommand(ctx, commandName, args, true),
                    description: 'Runs a custom command with some arguments. A debug file will be sent in a DM after the command has finished.'
                },
                {
                    parameters: 'create|add {commandName?} {~content+?}',
                    execute: (ctx, [commandName, content]) => this.createCommand(ctx, commandName, content),
                    description: 'Creates a new custom command with the content you give'
                },
                {
                    parameters: 'edit {commandName?} {~content+?}',
                    execute: (ctx, [commandName, content]) => this.editCommand(ctx, commandName, content),
                    description: 'Edits an existing custom command to have the content you specify'
                },
                {
                    parameters: 'set {commandName?} {~content+?}',
                    execute: (ctx, [commandName, content]) => this.setCommand(ctx, commandName, content),
                    description: 'Sets the custom command to have the content you specify. If the custom command doesnt exist it will be created.'
                },
                {
                    parameters: 'delete|remove {commandName?}',
                    execute: (ctx, [commandName]) => this.deleteCommand(ctx, commandName),
                    description: 'Deletes an existing custom command'
                },
                {
                    parameters: 'rename {oldName?} {newName?}',
                    execute: (ctx, [oldName, newName]) => this.renameCommand(ctx, oldName, newName),
                    description: 'Renames the custom command'
                },
                {
                    parameters: 'raw {commandName?}',
                    execute: (ctx, [commandName]) => this.getRawCommand(ctx, commandName),
                    description: 'Gets the raw content of the custom command'
                },
                {
                    parameters: 'list ',
                    execute: (ctx) => this.listCommands(ctx),
                    description: 'Lists all custom commands on this server'
                },
                {
                    parameters: 'cooldown {commandName} {duration:duration+=0ms}',
                    execute: (ctx, [commandName, duration]) => this.setCommandCooldown(ctx, commandName, duration),
                    description: 'Sets the cooldown of a custom command, in milliseconds'
                },
                {
                    parameters: 'author {commandName?}',
                    execute: (ctx, [commandName]) => this.getCommandAuthor(ctx, commandName),
                    description: 'Displays the name of the custom command\'s author'
                },
                {
                    parameters: 'flag|flags',
                    subcommands: [
                        {
                            parameters: '{commandName}',
                            execute: (ctx, [commandName]) => this.getCommandFlags(ctx, commandName),
                            description: 'Lists the flags the custom command accepts'
                        },
                        {
                            parameters: 'create|add {commandName} {~flags+}',
                            execute: (ctx, [commandName, flags]) => this.addCommandFlags(ctx, commandName, flags),
                            description: 'Adds multiple flags to your custom command. Flags should be of the form `-<f> <flag> [flag description]`\n' +
                                'e.g. `b!cc flags add myCommand -c category The category you want to use -n name Your name`'
                        },
                        {
                            parameters: 'delete|remove {commandName} {~flags+}',
                            execute: (ctx, [commandName, flags]) => this.removeCommandFlags(ctx, commandName, flags),
                            description: 'Removes multiple flags from your custom command. Flags should be of the form `-<f>`\n' +
                                'e.g. `b!cc flags remove myCommand -c -n`'
                        }
                    ]
                },
                {
                    parameters: 'setlang {commandName} {language}',
                    execute: (ctx, [commandName, language]) => this.setCommandLanguage(ctx, commandName, language),
                    description: 'Sets the language to use when returning the raw text of your custom command'
                },
                {
                    parameters: 'sethelp {commandName} {~helpText+?}',
                    execute: (ctx, [commandName, helpText]) => this.setCommandHelp(ctx, commandName, helpText),
                    description: 'Sets the help text to show for the command'
                },
                {
                    parameters: 'hide {commandName}',
                    execute: (ctx, [commandName]) => this.toggleCommandHidden(ctx, commandName),
                    description: 'Toggles whether the command is hidden from the command list or not'
                },
                {
                    parameters: 'setRole {commandName} {roles[0]}',
                    execute: (ctx, [commandName, roles]) => this.setCommandRoles(ctx, commandName, roles),
                    description: 'Sets the roles that are allowed to use the command'
                },
                {
                    parameters: 'shrinkwrap {commandNames[]}',
                    execute: (ctx, [commandNames]) => this.shrinkwrapCommands(ctx, commandNames),
                    description: 'Bundles up the given commands into a single file that you can download and install into another server'
                },
                {
                    parameters: 'install {shrinkwrapUrl?}',
                    execute: (ctx, [shrinkwrapUrl]) => this.installCommands(ctx, shrinkwrapUrl),
                    description: 'Bundles up the given commands into a single file that you can download and install into another server'
                },
                {
                    parameters: 'import {tagName} {commandName?}',
                    execute: (ctx, [tagName, commandName]) => this.importCommand(ctx, tagName, commandName ?? tagName),
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
    ): Promise<string | { content: string; files: FileOptions[]; } | undefined> {
        const result = await context.bbtag.execute(content, {
            message: context.message,
            inputRaw: input,
            isCC: true,
            limit: new CustomCommandLimit(),
            rootTagName: 'test',
            author: context.author.id
        });

        return debug ? bbtagUtil.createDebugOutput('test', content, input, result) : undefined;
    }

    public showDocs(context: GuildCommandContext, topic: string | undefined): SendPayload | string {
        const embed = getDocsEmbed(context, topic);
        if (embed === undefined)
            return this.error(`Oops, I didnt recognise that topic! Try using \`${context.prefix}${context.commandName} docs\` for a list of all topics`);

        return { embeds: [embed], isHelp: true };
    }

    public async runCommand(
        context: GuildCommandContext,
        commandName: string,
        input: string | undefined,
        debug: boolean
    ): Promise<string | { content: string; files: FileOptions[]; } | undefined> {
        const match = await this.requestReadableCommand(context, commandName, false);
        if (typeof match !== 'object')
            return match;

        if (debug && match.author !== context.author.id)
            return this.error('You cannot debug someone elses custom command.');

        if (guard.isAliasedCustomCommand(match))
            return this.error(`The command \`${commandName}\` is an alias to the tag \`${match.alias}\``);

        const result = await context.bbtag.execute(match.content, {
            message: context.message,
            inputRaw: input ?? '',
            isCC: true,
            limit: new CustomCommandLimit(),
            rootTagName: match.name,
            author: match.author,
            authorizer: match.authorizer,
            flags: match.flags,
            cooldown: match.cooldown
        });

        return debug ? bbtagUtil.createDebugOutput(match.name, match.content, input ?? '', result) : undefined;
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

        if (guard.isAliasedCustomCommand(match))
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

        if (guard.isAliasedCustomCommand(match.command))
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

    public async getRawCommand(context: GuildCommandContext, commandName: string | undefined): Promise<string | { content: string; files: FileOptions[]; } | undefined> {
        const match = await this.requestReadableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        if (guard.isAliasedCustomCommand(match))
            return this.error(`The command \`${match.name}\` is an alias to the tag \`${match.alias}\``);

        const response = this.success(`The raw code for \`${match.name}\` is:\n\`\`\`${match.lang ?? ''}\n${match.content}\n\`\`\``);
        return guard.checkMessageSize(response)
            ? response
            : {
                content: this.success(`The raw code for \`${match.name}\` is attached`),
                files: [
                    {
                        name: match.name + '.bbtag',
                        attachment: match.content
                    }
                ]
            };
    }

    public async listCommands(context: GuildCommandContext): Promise<{ embeds: [MessageEmbedOptions]; } | string | undefined> {
        const grouped: Record<string, string[]> = {};
        for (const command of await context.database.guilds.listCommands(context.channel.guild.id)) {
            const roles = command.roles === undefined || command.roles.length === 0 ? ['All Roles'] : command.roles;
            for (const role of roles) {
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

        const flagDefinitions = guard.isAliasedCustomCommand(match)
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

        if (guard.isAliasedCustomCommand(match))
            return this.error(`The \`${commandName}\` custom command is an alias to the tag \`${match.alias}\``);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _, ...addFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []];
        for (const flag of Object.keys(addFlags)) {
            const args = addFlags[flag];
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

        if (guard.isAliasedCustomCommand(match))
            return this.error(`The \`${commandName}\` custom command is an alias to the tag \`${match.alias}\``);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _, ...removeFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []]
            .filter(f => removeFlags[f.flag] === undefined);

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'flags', flags);
        return this.success(`The flags for \`${match.name}\` have been updated.`);
    }

    public async setCommandLanguage(context: GuildCommandContext, commandName: string, language: string): Promise<string | undefined> {
        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'lang', language);
        return this.success(`Lang for custom command \`${match.name}\` set.`);
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

    public async setCommandRoles(context: GuildCommandContext, commandName: string, roleNames: string[]): Promise<string | undefined> {
        const match = await this.requestEditableCommand(context, commandName);
        if (typeof match !== 'object')
            return match;

        const roles = [];
        for (const roleName of roleNames) {
            const role = await context.cluster.util.queryRole(context.channel, context.author, { guild: context.channel.guild, filter: roleName });
            if (role.state !== 'SUCCESS')
                return;
            roles.push(role.value);
        }

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, 'roles', roles.map(r => r.id));
        return this.success(`Roles for custom command \`${match.name}\` set to ${humanize.smartJoin(roles.map(r => `\`${r.name}\``), ', ', ' and ')}.`);
    }

    public async importCommand(context: GuildCommandContext, tagName: string, commandName: string | undefined): Promise<string> {
        commandName = normalizeName(commandName ?? tagName);
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

    public async shrinkwrapCommands(context: GuildCommandContext, commandNames: string[]): Promise<CommandResult> {
        const shrinkwrap: GuildShrinkwrap = { cc: {}, ar: [], are: null };
        const confirm = [
            'Salutations! You have discovered the super handy ShrinkWrapper9000!',
            '',
            'If you decide to proceed, this will:'
        ];

        const { commands, autoResponses, everythingAutoResponse } = await getShrinkwrapData(context.cluster.database, context.channel.guild.id);

        for (let commandName of commandNames) {
            commandName = commandName.toLowerCase();
            const command = commands[commandName];
            if (command === undefined || guard.isAliasedCustomCommand(command))
                continue;

            confirm.push(` - Export the custom command \`${commandName}\``);

            const ars = autoResponses[commandName];
            if (ars !== undefined) {
                for (const ar of ars) {
                    confirm.push(`   - Export the associated autoresponse to \`${ar.term}\`${ar.regex ? ' (regex)' : ''}`);
                    shrinkwrap.ar.push({ ...ar, executes: shrinkCommand(command) });
                }
            } else if (everythingAutoResponse?.executes === commandName) {
                confirm.push('   - Export the associated everything autoresponse');
                shrinkwrap.are = { executes: shrinkCommand(command) };
            } else {
                shrinkwrap.cc[commandName] = shrinkCommand(command);
            }
        }

        confirm.push(
            'This will not:',
            ' - Export variables',
            ' - Export authors or authorizers',
            ' - Export depedencies'
        );

        const shouldExport = await context.cluster.util.queryConfirm({
            context: context.channel,
            users: context.author,
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
                    attachment: JSON.stringify(<SignedGuildShrinkwrap>{
                        signature: signShrinkwrap(shrinkwrap, context.config),
                        payload: shrinkwrap
                    }, null, 2),
                    name: 'shrinkwrap.json'
                }
            ]
        };
    }

    public async installCommands(context: GuildCommandContext, shrinkwrapUrl?: string): Promise<string> {
        shrinkwrapUrl ??= context.message.attachments.first()?.url;
        if (shrinkwrapUrl === undefined)
            return this.error('You have to upload the installation file, or give me a URL to one.');

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
        const { commands, autoResponses, everythingAutoResponse } = await getShrinkwrapData(context.cluster.database, guildId);
        const shrinkwrap = signedShrinkwrap.value.payload;
        for (const commandName of Object.keys(shrinkwrap.cc)) {
            if (guard.hasProperty(commands, commandName.toLowerCase())) {
                confirm.push(this.error(`Ignore the command \`${commandName}\` as a command with that name already exists`));
                continue;
            }

            const command = shrinkwrap.cc[commandName];
            if (command === undefined)
                continue;

            confirm.push(this.success(`Import the command \`${commandName}\``));
            importSteps.push(async () => {
                await context.cluster.database.guilds.setCommand(guildId, commandName, {
                    ...command,
                    author: context.author.id
                });
            });
        }
        let arIndex = -1;
        let arCount = Object.values(autoResponses).reduce((c, a) => c + (a?.length ?? 0), 0);
        for (const autoresponse of shrinkwrap.ar) {
            const arName = `\`${autoresponse.term}\`${autoresponse.regex ? ' (regex)' : ''}`;
            if (arCount++ >= 20) {
                confirm.push(this.error(`Ignore the autoresponse to ${arName} as the limit has been reached.`));
                continue;
            }

            confirm.push(this.success(`Import the autoresponse ${arName}`));
            importSteps.push(async () => {
                let commandName;
                while (commands[commandName = `_autoresponse_${++arIndex}`] !== undefined);
                await context.cluster.database.guilds.addAutoresponse(guildId, { ...autoresponse, executes: commandName });
                await context.cluster.database.guilds.setCommand(guildId, commandName, {
                    ...autoresponse.executes,
                    author: context.author.id,
                    hidden: true,
                    managed: true
                });
            });
        }
        if (shrinkwrap.are !== null) {
            const are = shrinkwrap.are;
            if (everythingAutoResponse !== undefined) {
                confirm.push(this.error('Ignore everything autoresponse as one already exists'));
            } else {
                confirm.push(this.success('Import the autoresponse to everything'));
                importSteps.push(async () => {
                    let commandName;
                    while (commands[commandName = `_autoresponse_${++arIndex}`] !== undefined);
                    await context.cluster.database.guilds.setAutoresponse(guildId, 'everything', { executes: commandName });
                    await context.cluster.database.guilds.setCommand(guildId, commandName, {
                        ...are.executes,
                        author: context.author.id,
                        hidden: true,
                        managed: true
                    });
                });
            }
        }

        confirm.push(
            'This will also:',
            ' - Set you as the author for all imported commands'
        );

        const shouldImport = await context.cluster.util.queryConfirm({
            context: context.channel,
            users: context.author,
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
        currentCommand?: NamedStoredRawGuildCommand
    ): Promise<string | undefined> {
        content = await this.requestCommandContent(context, content);
        if (content === undefined)
            return;

        const analysis = context.bbtag.check(content);
        if (analysis.errors.length > 0)
            return this.error(`There were errors with the bbtag you provided!\n${bbtagUtil.stringifyAnalysis(analysis)}`);

        const command = {
            content: content,
            author: context.author.id,
            authorizer: context.author.id,
            hidden: currentCommand?.hidden ?? commandName.startsWith('_'),
            flags: currentCommand?.flags,
            cooldown: currentCommand?.cooldown,
            help: currentCommand?.help,
            lang: currentCommand?.lang,
            roles: currentCommand?.roles,
            uses: currentCommand?.uses
        };

        await context.database.guilds.setCommand(context.channel.guild.id, commandName, command);

        return this.success(`Custom command \`${commandName}\` ${operation}.\n${bbtagUtil.stringifyAnalysis(analysis)}`);
    }
    private async requestCommandName(
        context: GuildCommandContext,
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

        name = (await context.util.awaitQuery(context.channel, context.author, query))?.content;
        if (name === undefined || name === 'c')
            return undefined;

        name = normalizeName(name);
        return name.length > 0 ? name : undefined;
    }

    private async requestCommandContent(
        context: GuildCommandContext,
        content: string | undefined
    ): Promise<string | undefined> {
        if (content !== undefined && content.length > 0)
            return content;

        content = (await context.util.awaitQuery(context.channel, context.author, 'Enter the custom command\'s contents or type `c` to cancel:'))?.content;
        if (content === undefined || content === 'c')
            return undefined;

        return content.length > 0 ? content : undefined;
    }

    private async requestSettableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        allowQuery = true
    ): Promise<{ name: string; command?: NamedStoredGuildCommand; } | string | undefined> {
        const match = await this.requestCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        return { name: match.name, command: match.command };
    }

    private async requestEditableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        { managed = false, hidden = true, allowQuery = true } = {}
    ): Promise<NamedStoredGuildCommand | string | undefined> {
        const match = await this.requestSettableCommand(context, commandName, allowQuery);
        if (typeof match !== 'object')
            return match;

        if (match.command === undefined)
            return this.error(`The \`${match.name}\` custom command doesn't exist!`);

        if (!managed && !guard.isAliasedCustomCommand(match.command) && match.command.managed === true)
            return this.error(`The \`${match.name}\` custom command is a managed command`);

        if (!hidden && match.command.hidden === true)
            return this.error(`The \`${match.name}\` custom command is a hidden command`);

        return match.command;
    }

    private async requestReadableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        allowQuery = true
    ): Promise<NamedStoredGuildCommand | string | undefined> {
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
    ): Promise<{ name: string; command?: NamedStoredGuildCommand; } | string | undefined> {
        commandName = await this.requestCommandName(context, commandName, allowQuery ? undefined : '');
        if (commandName === undefined)
            return;

        const command = await context.database.guilds.getCommand(context.channel.guild.id, commandName);
        if (command === undefined)
            return { name: commandName };

        return { name: command.name, command };
    }
}

function normalizeName(title: string): string {
    return title.replace(/[^\d\w .,/#!$%^&*;:{}[\]=\-_~()<>]/gi, '').toLowerCase();
}

function shrinkCommand(command: NamedStoredRawGuildCommand): CustomCommandShrinkwrap {
    return {
        content: command.content,
        cooldown: command.cooldown,
        flags: command.flags,
        help: command.help,
        hidden: command.hidden,
        lang: command.lang,
        managed: command.managed,
        roles: command.roles,
        uses: command.uses
    };
}

function signShrinkwrap(shrinkwrap: GuildShrinkwrap, config: Configuration): string {
    const content = JSON.stringify(shrinkwrap);
    return createHmac('sha256', config.general.interface_key).update(content).digest('hex');
}

async function requestSafe(url: string): Promise<unknown> {
    try {
        const response = await fetch(url);
        return await response.json() as unknown;
    } catch {
        return undefined;
    }
}

async function getShrinkwrapData(
    database: Database,
    guildId: string
): Promise<{
    commands: Record<string, NamedStoredGuildCommand | undefined>;
    autoResponses: Record<string, GuildFilteredAutoresponse[] | undefined>;
    everythingAutoResponse: GuildAutoresponse | undefined;
}> {

    const autoresponses = await database.guilds.getAutoresponses(guildId);
    const commands = await database.guilds.listCommands(guildId);
    const commandMap: Record<string, NamedStoredGuildCommand> = {};
    const arMap: Record<string, GuildFilteredAutoresponse[]> = {};

    for (const command of commands) {
        commandMap[command.name] = command;
    }
    for (const ar of autoresponses.list ?? []) {
        (arMap[ar.executes] ??= []).push(ar);
    }

    return {
        commands: commandMap,
        autoResponses: arMap,
        everythingAutoResponse: autoresponses.everything
    };
}

/* eslint-disable @typescript-eslint/naming-convention */
const flagKeys = Object.keys<{ [P in Letter]: 0 }>({
    'a': 0, 'b': 0, 'c': 0, 'd': 0, 'e': 0, 'f': 0, 'g': 0, 'h': 0, 'i': 0, 'j': 0, 'k': 0, 'l': 0, 'm': 0, 'n': 0, 'o': 0, 'p': 0, 'q': 0, 'r': 0, 's': 0, 't': 0, 'u': 0, 'v': 0, 'w': 0, 'x': 0, 'y': 0, 'z': 0,
    'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0, 'G': 0, 'H': 0, 'I': 0, 'J': 0, 'K': 0, 'L': 0, 'M': 0, 'N': 0, 'O': 0, 'P': 0, 'Q': 0, 'R': 0, 'S': 0, 'T': 0, 'U': 0, 'V': 0, 'W': 0, 'X': 0, 'Y': 0, 'Z': 0
});
/* eslint-enable @typescript-eslint/naming-convention */

const mapCustomCommandShrinkwrap = mapping.mapObject<CustomCommandShrinkwrap>({
    content: mapping.mapString,
    cooldown: mapping.mapOptionalNumber,
    flags: mapping.mapArray(
        mapping.mapObject<FlagDefinition>({
            description: mapping.mapString,
            word: mapping.mapString,
            flag: mapping.mapIn(...flagKeys)
        }),
        { ifUndefined: mapping.result.undefined }
    ),
    help: mapping.mapOptionalString,
    hidden: mapping.mapOptionalBoolean,
    lang: mapping.mapOptionalString,
    managed: mapping.mapOptionalBoolean,
    roles: mapping.mapArray(mapping.mapString, { ifUndefined: mapping.result.undefined }),
    uses: mapping.mapOptionalNumber
});

const mapGuildShrinkwrap = mapping.mapObject<GuildShrinkwrap>({
    are: mapping.mapObject<AutoresponseShrinkwrap | null>({
        executes: mapCustomCommandShrinkwrap
    }, { ifNull: mapping.result.null }),
    ar: mapping.mapArray(
        mapping.mapObject<FilteredAutoresponseShrinkwrap>({
            executes: mapCustomCommandShrinkwrap,
            regex: mapping.mapBoolean,
            term: mapping.mapString
        })
    ),
    cc: mapping.mapRecord(mapCustomCommandShrinkwrap)
});

const mapSignedGuildShrinkwrap = mapping.mapObject<SignedGuildShrinkwrap>({
    signature: mapping.mapOptionalString,
    payload: mapping.mapChoice(mapping.mapJson(mapGuildShrinkwrap), mapGuildShrinkwrap)
});
