import type { Cluster } from '@blargbot/cluster';
import type { CommandGetCoreResult, CommandProperties, ICommand } from '@blargbot/cluster/types.js';
import { CommandType, commandTypeDetails, guard } from '@blargbot/cluster/utils/index.js';
import { metrics } from '@blargbot/core/Metrics.js';
import { isGuildChannel } from '@blargbot/discord-util';
import type { CommandPermissions, NamedGuildCommandTag, StoredTag } from '@blargbot/domain/models/index.js';
import type { FlagDefinition } from '@blargbot/flags';
import type { IFormattable } from '@blargbot/formatting';
import { util } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';
import * as Eris from 'eris';

import type { CommandContext } from '../../command/index.js';
import templates from '../../text.js';
import { CommandManager } from './CommandManager.js';

export class CustomCommandManager extends CommandManager<NamedGuildCommandTag> {
    public readonly size: number = 0;

    public constructor(cluster: Cluster) {
        super(cluster);
    }

    protected async getCore(name: string, location?: Eris.Guild | Eris.KnownTextableChannel): Promise<CommandGetCoreResult<NamedGuildCommandTag>> {
        if (location === undefined)
            return { state: 'NOT_FOUND' };

        const guild = location instanceof Eris.Guild ? location
            : isGuildChannel(location) ? location.guild
                : undefined;

        if (guild === undefined)
            return { state: 'NOT_FOUND' };

        const command = await this.cluster.database.guilds.getCommand(guild.id, name);
        if (command === undefined)
            return { state: 'NOT_FOUND' };

        const impl = guard.isGuildImportedCommandTag(command)
            ? await this.cluster.database.tags.get(command.alias)
            : undefined;

        return { state: 'FOUND', detail: new NormalizedCommandTag(command, impl) };
    }

    public load(): Promise<void> {
        return Promise.resolve();
    }

    protected async allCommandNames(location?: Eris.Guild | Eris.KnownTextableChannel): Promise<Iterable<string>> {
        if (location === undefined)
            return [];

        const guild = location instanceof Eris.Guild ? location : isGuildChannel(location) ? location.guild : undefined;
        if (guild === undefined)
            return [];

        return await this.cluster.database.guilds.getCustomCommandNames(guild.id);
    }

    public async configure(_user: Eris.User, names: string[], guild: Eris.Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]> {
        if (names.length === 0)
            return [];

        const commandNames = new Set((await this.cluster.database.guilds.getCustomCommands(guild.id)).map(c => c.name));
        names = names.map(n => n.toLowerCase()).filter(n => commandNames.has(n));
        if (names.length === 0)
            return [];

        return await this.cluster.database.guilds.updateCommands(guild.id, names, permissions);
    }
}

interface CustomCommandDetails {
    readonly content: string;
    readonly tagVars: boolean;
    readonly author: string | undefined;
    readonly authorizer: string | undefined;
    readonly flags: ReadonlyArray<FlagDefinition<string>> | undefined;
    readonly cooldown: number | undefined;
}

class NormalizedCommandTag implements ICommand<NamedGuildCommandTag> {
    public readonly id: string;
    public readonly name: string;
    public readonly aliases: [];
    public readonly category: CommandProperties;
    public readonly description: IFormattable<string> | undefined;
    public readonly flags: ReadonlyArray<FlagDefinition<string>>;
    public readonly signatures: [];
    public readonly disabled: boolean;
    public readonly permission: string;
    public readonly roles: readonly string[];
    public readonly hidden: boolean;
    public readonly isOnWebsite: false;

    public constructor(
        public readonly implementation: NamedGuildCommandTag,
        public readonly tag: StoredTag | undefined
    ) {
        this.id = implementation.id;
        this.name = implementation.name;
        this.aliases = [];
        this.category = commandTypeDetails[CommandType.CUSTOM];
        this.description = util.literal(implementation.help) ?? templates.documentation.command.categories.custom.noHelp;
        this.flags = tag?.flags ?? ('flags' in implementation ? implementation.flags : []) ?? [];
        this.signatures = [];
        this.disabled = this.implementation.disabled ?? false;
        this.permission = this.implementation.permission ?? '0';
        this.roles = this.implementation.roles ?? [];
        this.hidden = this.implementation.hidden ?? false;
        this.isOnWebsite = false;
    }

    public async execute(context: CommandContext): Promise<undefined> {
        if (!guard.isGuildCommandContext(context))
            return;

        const details = await this.#getDetails(context);
        if ('response' in details) {
            await context.reply(details.response);
            return;
        }

        const { content, ...options } = details;

        metrics.commandCounter.labels('custom', 'custom').inc();
        await context.cluster.bbtag.execute(content, {
            ...options,
            authorId: options.author,
            authorizerId: options.authorizer,
            rootTagName: context.commandName,
            message: context.message as never,
            inputRaw: context.argsString,
            isCC: true,
            limit: 'customCommandLimit',
            prefix: context.prefix
        });
        return undefined;
    }

    async #getDetails(context: CommandContext): Promise<{ response: IFormattable<string>; } | CustomCommandDetails> {
        if (!guard.isGuildImportedCommandTag(this.implementation)) {
            return {
                author: this.implementation.author ?? undefined,
                authorizer: this.implementation.authorizer ?? undefined,
                content: this.implementation.content,
                cooldown: this.implementation.cooldown,
                flags: this.implementation.flags,
                tagVars: false
            };
        }

        if (this.tag === undefined) {
            const oldAuthor = await context.util.getUser(this.implementation.author ?? '');
            return {
                response: templates.commands.ccommand.errors.importDeleted({
                    commandName: context.commandName,
                    tagName: this.implementation.alias,
                    author: oldAuthor,
                    authorId: this.implementation.author ?? '????'
                })
            };
        }

        if (this.implementation.author === this.tag.author || !hasValue(this.implementation.author)) {
            await context.database.tags.incrementUses(this.tag.name);
            const cooldown = Math.max(this.tag.cooldown ?? 0, this.implementation.cooldown ?? 0);
            return {
                author: this.tag.author,
                authorizer: this.implementation.authorizer ?? undefined,
                content: this.tag.content,
                cooldown: cooldown <= 0 ? undefined : cooldown,
                flags: this.tag.flags,
                tagVars: true
            };
        }

        const newAuthor = await context.util.getUser(this.tag.author);
        const oldAuthor = await context.util.getUser(this.implementation.author);
        return {
            response: templates.commands.ccommand.errors.importChanged({
                commandName: context.commandName,
                tagName: this.implementation.alias,
                oldAuthor,
                oldAuthorId: this.implementation.author,
                newAuthor,
                newAuthorId: this.tag.author
            })
        };
    }
}
