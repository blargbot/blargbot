import { bbtag } from '@blargbot/bbtag';
import { Cluster } from '@blargbot/cluster';
import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, CustomCommandShrinkwrap, GuildCommandContext, GuildShrinkwrap, ICommand, SignedGuildShrinkwrap } from '@blargbot/cluster/types';
import { codeBlock, CommandType, guard, parse, snowflake } from '@blargbot/cluster/utils';
import { Configuration } from '@blargbot/config';
import { IFormattable, literal } from '@blargbot/domain/messages/types';
import { FlagDefinition, NamedGuildCommandTag, NamedGuildSourceCommandTag } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';
import { createHmac } from 'crypto';
import { Role } from 'eris';
import moment, { Duration } from 'moment-timezone';
import fetch from 'node-fetch';

import { RawBBTagCommandResult } from '../../command/RawBBTagCommandResult';
import { BBTagDocumentationManager } from '../../managers/documentation/BBTagDocumentationManager';
import templates from '../../text';

const cmd = templates.commands.ccommand;

export class CustomCommandCommand extends GuildCommand {
    public static readonly reservedCommandNames = new Set<string>([`ccommand`, `editcommand`]);
    readonly #docs: BBTagDocumentationManager;

    public constructor(cluster: Cluster) {
        super({
            name: `ccommand`,
            aliases: [`cc`],
            category: CommandType.ADMIN,
            description: cmd.description({
                tos: cluster.util.websiteLink(`/bbtag/subtags/tos`),
                subtags: cluster.util.websiteLink(`/bbtag/subtags`)
            }),
            definitions: [
                {
                    parameters: `test|eval|exec|vtest`,
                    subcommands: [
                        {
                            parameters: `{~code+}`,
                            execute: (ctx, [code]) => this.runRaw(ctx, code.asString, ``, false),
                            description: cmd.test.default.description
                        },
                        {
                            parameters: `debug {~code+}`,
                            execute: (ctx, [code]) => this.runRaw(ctx, code.asString, ``, true),
                            description: cmd.test.debug.description
                        }
                    ]
                },
                {
                    parameters: `docs {topic+?}`,
                    execute: (ctx, [topic]) => this.showDocs(ctx, topic.asOptionalString),
                    description: cmd.docs.description
                },
                {
                    parameters: `debug {commandName} {~args+?}`,
                    execute: (ctx, [commandName, args]) => this.runCommand(ctx, commandName.asString, args.asOptionalString, true),
                    description: cmd.debug.description
                },
                {
                    parameters: `create|add {commandName?} {~content+?}`,
                    execute: (ctx, [commandName, content]) => this.createCommand(ctx, commandName.asOptionalString, content.asOptionalString),
                    description: cmd.create.description
                },
                {
                    parameters: `edit {commandName?} {~content+?}`,
                    execute: (ctx, [commandName, content]) => this.editCommand(ctx, commandName.asOptionalString, content.asOptionalString),
                    description: cmd.edit.description
                },
                {
                    parameters: `set {commandName?} {~content+?}`,
                    execute: (ctx, [commandName, content]) => this.setCommand(ctx, commandName.asOptionalString, content.asOptionalString),
                    description: cmd.set.description
                },
                {
                    parameters: `delete|remove {commandName?}`,
                    execute: (ctx, [commandName]) => this.deleteCommand(ctx, commandName.asOptionalString),
                    description: cmd.delete.description
                },
                {
                    parameters: `rename {oldName?} {newName?}`,
                    execute: (ctx, [oldName, newName]) => this.renameCommand(ctx, oldName.asOptionalString, newName.asOptionalString),
                    description: cmd.rename.description
                },
                {
                    parameters: `raw {commandName?} {fileExtension:literal(bbtag|txt)=bbtag}`,
                    execute: (ctx, [commandName, fileExtension]) => this.getRawCommand(ctx, commandName.asOptionalString, fileExtension.asLiteral),
                    description: cmd.raw.description
                },
                {
                    parameters: `list `,
                    execute: (ctx) => this.listCommands(ctx),
                    description: cmd.list.description
                },
                {
                    parameters: `cooldown {commandName} {duration:duration+=0ms}`,
                    execute: (ctx, [commandName, duration]) => this.setCommandCooldown(ctx, commandName.asString, duration.asDuration),
                    description: cmd.cooldown.description
                },
                {
                    parameters: `author {commandName?}`,
                    execute: (ctx, [commandName]) => this.getCommandAuthor(ctx, commandName.asString),
                    description: cmd.author.description
                },
                {
                    parameters: `flag|flags`,
                    subcommands: [
                        {
                            parameters: `{commandName}`,
                            execute: (ctx, [commandName]) => this.getCommandFlags(ctx, commandName.asString),
                            description: cmd.flag.get.description
                        },
                        {
                            parameters: `create|add {commandName} {~flags+}`,
                            execute: (ctx, [commandName, flags]) => this.addCommandFlags(ctx, commandName.asString, flags.asString),
                            description: cmd.flag.create.description
                        },
                        {
                            parameters: `delete|remove {commandName} {~flags+}`,
                            execute: (ctx, [commandName, flags]) => this.removeCommandFlags(ctx, commandName.asString, flags.asString),
                            description: cmd.flag.delete.description
                        }
                    ]
                },
                {
                    parameters: `sethelp {commandName} {~helpText+?}`,
                    execute: (ctx, [commandName, helpText]) => this.setCommandHelp(ctx, commandName.asString, helpText.asOptionalString),
                    description: cmd.setHelp.description
                },
                {
                    parameters: `hide {commandName}`,
                    execute: (ctx, [commandName]) => this.toggleCommandHidden(ctx, commandName.asString),
                    description: cmd.hide.description
                },
                {
                    parameters: `setRole {commandName} {roles:role[0]}`,
                    execute: (ctx, [commandName, roles]) => this.setCommandRoles(ctx, commandName.asString, roles.asRoles),
                    description: cmd.setRole.description
                },
                {
                    parameters: `shrinkwrap {commandNames[]}`,
                    execute: (ctx, [commandNames]) => this.shrinkwrapCommands(ctx, commandNames.asStrings),
                    description: cmd.shrinkwrap.description
                },
                {
                    parameters: `install {shrinkwrapUrl?}`,
                    execute: (ctx, [shrinkwrapUrl]) => this.installCommands(ctx, shrinkwrapUrl.asOptionalString),
                    description: cmd.install.description
                },
                {
                    parameters: `import {tagName} {commandName?}`,
                    execute: (ctx, [tagName, commandName]) => this.importCommand(ctx, tagName.asString, commandName.asOptionalString ?? tagName.asString),
                    description: cmd.import.description
                }
            ]
        });

        this.#docs = new BBTagDocumentationManager(cluster, `ccommand`, `cc`);
        cluster.discord.on(`interactionCreate`, i => this.#docs.handleInteraction(i));
    }

    public async runRaw(
        context: GuildCommandContext,
        content: string,
        input: string,
        debug: boolean
    ): Promise<CommandResult> {
        const result = await context.bbtag.execute(content, {
            message: context.message,
            inputRaw: input,
            isCC: true,
            limit: `customCommandLimit`,
            rootTagName: `test`,
            authorId: context.author.id,
            prefix: context.prefix
        });

        if (!debug)
            return undefined;

        await context.send(context.author, bbtag.createDebugOutput(result));
        return cmd.debug.success;
    }

    public async showDocs(ctx: GuildCommandContext, topic: string | undefined): Promise<CommandResult> {
        return await this.#docs.createMessageContent(topic ?? ``, ctx.author, ctx.channel);
    }

    public async runCommand(
        context: GuildCommandContext,
        commandName: string,
        input: string | undefined,
        debug: boolean
    ): Promise<CommandResult> {
        const match = await this.#requestReadableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        if (debug && match.author !== context.author.id)
            return cmd.debug.notOwner;

        if (guard.isGuildImportedCommandTag(match))
            return cmd.errors.isAlias({ commandName, tagName: match.alias });

        const result = await context.bbtag.execute(match.content, {
            message: context.message,
            inputRaw: input ?? ``,
            isCC: true,
            limit: `customCommandLimit`,
            rootTagName: match.name,
            authorId: match.author ?? undefined,
            authorizerId: match.authorizer ?? undefined,
            flags: match.flags,
            cooldown: match.cooldown,
            prefix: context.prefix
        });

        if (!debug)
            return undefined;

        await context.send(context.author, bbtag.createDebugOutput(result));
        return cmd.debug.success;
    }

    public async createCommand(context: GuildCommandContext, commandName: string | undefined, content: string | undefined): Promise<CommandResult> {
        const match = await this.#requestCreatableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        return await this.#saveCommand(context, cmd.create.success, undefined, match.name, content);
    }

    public async editCommand(context: GuildCommandContext, commandName: string | undefined, content: string | undefined): Promise<CommandResult> {
        const match = await this.#requestEditableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        if (guard.isGuildImportedCommandTag(match))
            return cmd.errors.isAlias({ commandName: match.name, tagName: match.alias });

        return await this.#saveCommand(context, cmd.edit.success, match.id, match.name, content, match);
    }

    public async deleteCommand(context: GuildCommandContext, commandName: string | undefined): Promise<CommandResult> {
        const match = await this.#requestEditableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        await context.database.guilds.setCommand(context.channel.guild.id, match.name, undefined);
        return cmd.delete.success({ name: match.name });
    }

    public async setCommand(context: GuildCommandContext, commandName: string | undefined, content: string | undefined): Promise<CommandResult> {
        const match = await this.#requestSettableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        if (guard.isGuildImportedCommandTag(match.command))
            return cmd.errors.isAlias({ commandName: match.name, tagName: match.command.alias });

        return await this.#saveCommand(context, cmd.set.success, match.command?.id, match.name, content, match.command);
    }

    public async renameCommand(context: GuildCommandContext, oldName: string | undefined, newName: string | undefined): Promise<CommandResult> {
        const from = await this.#requestEditableCommand(context, oldName, cmd.rename.enterOldName);
        if (`response` in from)
            return from.response;

        const to = await this.#requestCreatableCommand(context, newName, cmd.rename.enterNewName);
        if (`response` in to)
            return to.response;

        await context.database.guilds.renameCommand(context.channel.guild.id, from.name, to.name);

        return cmd.rename.success({ oldName: from.name, newName: to.name });
    }

    public async getRawCommand(context: GuildCommandContext, commandName: string | undefined, fileExtension: string): Promise<CommandResult> {
        const match = await this.#requestReadableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        if (guard.isGuildImportedCommandTag(match))
            return cmd.errors.isAlias({ commandName: match.name, tagName: match.alias });

        return new RawBBTagCommandResult(
            cmd.raw.inline({ name: match.name, content: match.content }),
            cmd.raw.attached({ name: match.name }),
            match.content,
            `${match.name}.${fileExtension}`
        );
    }

    public async listCommands(context: GuildCommandContext): Promise<CommandResult> {
        const grouped: Record<string, string[]> = {};
        const any = [];
        for await (const command of context.cluster.commands.custom.list(context.channel.guild)) {
            if (command.state === `ALLOWED`) {
                for await (const role of this.#getRoles(context, command.detail.command)) {
                    if (role === undefined)
                        any.push(role);
                    else
                        (grouped[role] ??= []).push(command.detail.command.name);
                }
            }
        }
        return {
            embeds: [
                {
                    title: cmd.list.embed.title,
                    color: 0x7289da,
                    fields: [
                        {
                            name: cmd.list.embed.field.anyRole.name,
                            commands: any
                        },
                        ...Object.entries(grouped)
                            .map(([role, commands]) => ({ name: literal(role), commands }))
                    ].filter(x => x.commands.length > 0)
                        .map(x => ({
                            name: x.name,
                            value: literal(codeBlock(x.commands.join(`, `), `ini`)),
                            inline: true
                        }))
                }
            ]
        };
    }

    async * #getRoles(context: GuildCommandContext, command: ICommand): AsyncGenerator<string | undefined> {
        if (command.roles.length === 0)
            yield undefined;

        if (guard.isGuildCommandContext(context)) {
            for (const roleStr of command.roles) {
                const role = await context.util.getRole(context.channel.guild, roleStr)
                    ?? context.channel.guild.roles.find(r => r.name.toLowerCase() === roleStr.toLowerCase());

                if (role !== undefined)
                    yield role.name;
            }
        }
    }

    public async setCommandCooldown(context: GuildCommandContext, commandName: string, cooldown?: Duration): Promise<CommandResult> {
        if (cooldown !== undefined && cooldown.asMilliseconds() < 0)
            return cmd.cooldown.mustBePositive;

        const match = await this.#requestEditableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, `cooldown`, cooldown?.asMilliseconds());
        cooldown ??= moment.duration();
        return cmd.cooldown.success({ name: match.name, cooldown });
    }

    public async getCommandAuthor(context: GuildCommandContext, commandName: string | undefined): Promise<CommandResult> {
        const match = await this.#requestReadableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        const author = await context.database.users.get(match.author ?? ``);
        if (!guard.hasValue(match.authorizer) || match.authorizer === match.author)
            return cmd.author.noAuthorizer({ name: match.name, author });

        const authorizer = await context.database.users.get(match.authorizer);
        return cmd.author.withAuthorizer({ name: match.name, author, authorizer });
    }

    public async getCommandFlags(context: GuildCommandContext, commandName: string): Promise<CommandResult> {
        const match = await this.#requestReadableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        const flagDefinitions = guard.isGuildImportedCommandTag(match)
            ? (await context.database.tags.get(match.alias))?.flags ?? []
            : match.flags ?? [];

        if (flagDefinitions.length === 0)
            return cmd.flag.get.none({ name: match.name });
        return cmd.flag.get.success({ name: match.name, flags: flagDefinitions });
    }

    public async addCommandFlags(context: GuildCommandContext, commandName: string, flagsRaw: string): Promise<CommandResult> {
        const match = await this.#requestEditableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        if (guard.isGuildImportedCommandTag(match))
            return cmd.errors.isAlias({ commandName: match.name, tagName: match.alias });

        const { _, ...addFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []];
        for (const [flag, args] of Object.entries(addFlags)) {
            if (args === undefined || args.length === 0)
                return cmd.flag.create.wordMissing({ flag });

            if (flags.some(f => f.flag === flag))
                return cmd.flag.create.flagExists({ flag });

            const word = args.get(0)?.value.replace(/[^a-z]/g, ``).toLowerCase() ?? ``;
            if (flags.some(f => f.word === word))
                return cmd.flag.create.wordExists({ word });

            const description = args.slice(1).merge().value.replace(/\n/g, ` `);
            flags.push({ flag, word, description });
        }

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, `flags`, flags);
        return cmd.flag.updated({ name: match.name });
    }

    public async removeCommandFlags(context: GuildCommandContext, commandName: string, flagsRaw: string): Promise<CommandResult> {
        const match = await this.#requestEditableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        if (guard.isGuildImportedCommandTag(match))
            return cmd.errors.isAlias({ commandName: match.name, tagName: match.alias });

        const { _, ...removeFlags } = parse.flags([], flagsRaw);
        const flags = [...match.flags ?? []]
            .filter(f => removeFlags[f.flag] === undefined);

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, `flags`, flags);
        return cmd.flag.updated({ name: match.name });
    }

    public async setCommandHelp(context: GuildCommandContext, commandName: string, helpText: string | undefined): Promise<CommandResult> {
        const match = await this.#requestEditableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, `help`, helpText);
        return cmd.setHelp.success({ name: match.name });
    }

    public async toggleCommandHidden(context: GuildCommandContext, commandName: string): Promise<CommandResult> {
        const match = await this.#requestEditableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        const isNowHidden = match.hidden !== true;
        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, `hidden`, isNowHidden);
        return cmd.hide.success({ name: match.name, hidden: isNowHidden });
    }

    public async setCommandRoles(context: GuildCommandContext, commandName: string, roles: readonly Role[]): Promise<CommandResult> {
        const match = await this.#requestEditableCommand(context, commandName);
        if (`response` in match)
            return match.response;

        await context.database.guilds.setCommandProp(context.channel.guild.id, match.name, `roles`, roles.map(r => r.id));
        return cmd.setRole.success({ name: match.name, roles });
    }

    public async importCommand(context: GuildCommandContext, tagName: string, commandName: string | undefined): Promise<CommandResult> {
        commandName = await this.#requestCommandName(context, commandName ?? tagName);
        if (commandName === undefined)
            return undefined;

        if (await context.database.guilds.getCommand(context.channel.guild.id, commandName) !== undefined)
            return cmd.errors.alreadyExists({ name: commandName });

        const tag = await context.database.tags.get(tagName);
        if (tag === undefined)
            return cmd.import.tagMissing({ name: tagName });

        const author = await context.database.users.get(tag.author);
        await context.database.guilds.setCommand(context.channel.guild.id, commandName, {
            id: snowflake.create().toString(),
            author: tag.author,
            alias: tagName,
            authorizer: context.author.id
        });
        return cmd.import.success({
            tagName: tag.name,
            author: author,
            authorizer: context.author,
            commandName: commandName
        });
    }

    public async shrinkwrapCommands(context: GuildCommandContext, commandNames: readonly string[]): Promise<CommandResult> {
        const shrinkwrap: GuildShrinkwrap = { cc: {} };
        const commands = new Map((await context.database.guilds.getCustomCommands(context.channel.guild.id)).map(c => [c.name, c] as const));
        const steps = [];
        for (let commandName of commandNames) {
            commandName = commandName.toLowerCase();
            const command = commands.get(commandName);
            if (command === undefined || guard.isGuildImportedCommandTag(command))
                continue;

            steps.push(cmd.shrinkwrap.confirm.export({ name: command.name }));

            shrinkwrap.cc[command.name] = {
                content: command.content,
                cooldown: command.cooldown,
                disabled: command.disabled,
                flags: command.flags,
                help: command.help,
                hidden: command.hidden,
                permission: command.permission,
                roles: command.roles
            };
        }

        const shouldExport = await context.queryConfirm({
            prompt: cmd.shrinkwrap.confirm.prompt({ steps }),
            continue: cmd.shrinkwrap.confirm.continue,
            cancel: cmd.shrinkwrap.confirm.cancel,
            fallback: false
        });

        if (!shouldExport)
            return cmd.shrinkwrap.cancelled;

        return {
            content: cmd.shrinkwrap.success,
            files: [
                {
                    file: JSON.stringify(<SignedGuildShrinkwrap>{
                        signature: signShrinkwrap(shrinkwrap, context.config),
                        payload: shrinkwrap
                    }, null, 2),
                    name: `shrinkwrap.json`
                }
            ]
        };
    }

    public async installCommands(context: GuildCommandContext, shrinkwrapUrl?: string): Promise<CommandResult> {
        if (shrinkwrapUrl === undefined) {
            if (context.message.attachments.length === 0)
                return cmd.install.fileMissing;
            shrinkwrapUrl = context.message.attachments[0].url;
        }

        const content = await requestSafe(shrinkwrapUrl);
        const signedShrinkwrap = mapSignedGuildShrinkwrap(content);
        if (!signedShrinkwrap.valid)
            return cmd.install.malformed;

        const importSteps: Array<() => Promise<unknown>> = [];
        const steps = [];

        const warning = signedShrinkwrap.value.signature === undefined ? cmd.install.confirm.unsigned
            : signedShrinkwrap.value.signature !== signShrinkwrap(signedShrinkwrap.value.payload, context.config) ? cmd.install.confirm.tampered
                : undefined;

        const guildId = context.channel.guild.id;
        const commandNames = new Set((await context.database.guilds.getCustomCommands(guildId)).map(c => c.name));
        const shrinkwrap = signedShrinkwrap.value.payload;
        for (const [commandName, command] of Object.entries(shrinkwrap.cc)) {
            if (command === undefined)
                continue;

            if (commandNames.has(commandName.toLowerCase())) {
                steps.push(cmd.install.confirm.skip({ name: commandName }));
                continue;
            }

            steps.push(cmd.install.confirm.import({ name: commandName }));
            importSteps.push(async () => {
                await context.cluster.database.guilds.setCommand(guildId, commandName, {
                    id: snowflake.create().toString(),
                    ...command,
                    author: context.author.id
                });
            });
        }

        const shouldImport = await context.queryConfirm({
            prompt: cmd.install.confirm.prompt({ warning, steps }),
            continue: cmd.install.confirm.continue,
            cancel: cmd.install.confirm.cancel,
            fallback: false
        });

        if (!shouldImport)
            return cmd.install.cancelled;

        for (const step of importSteps)
            await step();

        return cmd.install.success;
    }

    async #saveCommand(
        context: GuildCommandContext,
        success: (value: { name: string; errors: Iterable<IFormattable<string>>; }) => CommandResult,
        id: string | undefined,
        commandName: string,
        content: string | undefined,
        currentCommand?: NamedGuildSourceCommandTag
    ): Promise<CommandResult> {
        content = await this.#requestCommandContent(context, content);
        if (content === undefined)
            return;

        const analysis = context.bbtag.check(content);
        const errors = [];
        for (const error of analysis.errors)
            errors.push(cmd.errors.bbtagError(error));
        for (const warning of analysis.warnings)
            errors.push(cmd.errors.bbtagWarning(warning));

        if (analysis.errors.length > 0)
            return cmd.errors.invalidBBTag({ errors });

        const command = {
            id: id ?? snowflake.create().toString(),
            content: content,
            author: context.author.id,
            authorizer: context.author.id,
            hidden: currentCommand?.hidden ?? commandName.startsWith(`_`),
            flags: currentCommand?.flags,
            cooldown: currentCommand?.cooldown,
            help: currentCommand?.help,
            roles: currentCommand?.roles
        };

        await context.database.guilds.setCommand(context.channel.guild.id, commandName, command);

        return success({ name: commandName, errors });
    }

    async #requestCommandName(
        context: GuildCommandContext,
        name: string | undefined,
        query: IFormattable<string> = cmd.request.name
    ): Promise<string | undefined> {
        if (name === undefined) {
            const nameResult = await context.queryText({ prompt: query });
            if (nameResult.state !== `SUCCESS`)
                return undefined;

            name = nameResult.value;
        }

        name = normalizeName(name);
        if (CustomCommandCommand.reservedCommandNames.has(name)) {
            await context.reply(cmd.errors.nameReserved({ name }));
            return undefined;
        }

        return name.length > 0 ? name : undefined;
    }

    async #requestCommandContent(
        context: GuildCommandContext,
        content: string | undefined
    ): Promise<string | undefined> {
        if (content !== undefined && content.length > 0)
            return content;

        const contentResult = await context.queryText({ prompt: cmd.request.content });
        if (contentResult.state !== `SUCCESS`)
            return undefined;

        return contentResult.value;
    }

    async #requestSettableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        query?: IFormattable<string>
    ): Promise<{ name: string; command?: NamedGuildCommandTag; } | { response: CommandResult; }> {
        const match = await this.#requestCommand(context, commandName, query);
        if (`response` in match)
            return match;

        return { name: match.name, command: match.command };
    }

    async #requestEditableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        query?: IFormattable<string>,
        allowHidden = true
    ): Promise<NamedGuildCommandTag | { response: CommandResult; }> {
        const match = await this.#requestSettableCommand(context, commandName, query);
        if (`response` in match)
            return match;

        if (match.command === undefined)
            return { response: cmd.errors.doesNotExist({ name: match.name }) };

        if (!allowHidden && match.command.hidden === true)
            return { response: cmd.errors.isHidden({ name: match.name }) };

        return match.command;
    }

    async #requestReadableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        query?: IFormattable<string>
    ): Promise<NamedGuildCommandTag | { response: CommandResult; }> {
        const match = await this.#requestCommand(context, commandName, query);
        if (`response` in match)
            return match;

        if (match.command === undefined)
            return { response: cmd.errors.doesNotExist({ name: match.name }) };

        return match.command;
    }

    async #requestCreatableCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        query?: IFormattable<string>
    ): Promise<{ name: string; } | { response: CommandResult; }> {
        const match = await this.#requestCommand(context, commandName, query);
        if (`response` in match)
            return match;

        if (match.command !== undefined)
            return { response: cmd.errors.alreadyExists({ name: match.name }) };

        return { name: match.name };
    }

    async #requestCommand(
        context: GuildCommandContext,
        commandName: string | undefined,
        query?: IFormattable<string>
    ): Promise<{ name: string; command?: NamedGuildCommandTag; } | { response: CommandResult; }> {
        commandName = await this.#requestCommandName(context, commandName, query);
        if (commandName === undefined)
            return { response: undefined };

        const command = await context.database.guilds.getCommand(context.channel.guild.id, commandName);
        if (command !== undefined)
            return { name: command.name, command };

        if (commandName.length > 100)
            return { response: cmd.errors.tooLong({ max: 100 }) };

        return { name: commandName };
    }
}

function normalizeName(title: string): string {
    return title.replace(/[^\d\w .,/#!$%^&*;:{}[\]=\-_~()<>]/gi, ``).toLowerCase();
}

function signShrinkwrap(shrinkwrap: GuildShrinkwrap, config: Configuration): string {
    const content = JSON.stringify(shrinkwrap);
    return createHmac(`sha256`, config.general.shrinkwrapKey).update(content).digest(`hex`);
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
        mapping.object<FlagDefinition<string>>({
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
