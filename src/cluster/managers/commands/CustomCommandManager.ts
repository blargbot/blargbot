import { Cluster } from '@blargbot/cluster';
import { CommandContext } from '@blargbot/cluster/command';
import { CommandGetCoreResult, CommandSignature, ICommand } from '@blargbot/cluster/types';
import { guard, humanize } from '@blargbot/cluster/utils';
import { metrics } from '@blargbot/core/Metrics';
import { CommandPermissions, FlagDefinition, NamedGuildCommandTag, StoredTag } from '@blargbot/domain/models';
import { Guild, KnownTextableChannel, User } from 'eris';

import { CommandManager } from './CommandManager';

export class CustomCommandManager extends CommandManager<NamedGuildCommandTag> {
    public readonly size: number = 0;

    public constructor(cluster: Cluster) {
        super(cluster);
    }

    protected async getCore(name: string, location?: Guild | KnownTextableChannel): Promise<CommandGetCoreResult<NamedGuildCommandTag>> {
        if (location === undefined)
            return { state: 'NOT_FOUND' };

        const guild = location instanceof Guild ? location
            : guard.isGuildChannel(location) ? location.guild
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

    protected async allCommandNames(location?: Guild | KnownTextableChannel): Promise<Iterable<string>> {
        if (location === undefined)
            return [];

        const guild = location instanceof Guild ? location : guard.isGuildChannel(location) ? location.guild : undefined;
        if (guild === undefined)
            return [];

        return await this.cluster.database.guilds.getCustomCommandNames(guild.id);
    }

    public async configure(_user: User, names: string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]> {
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
    readonly author: string;
    readonly authorizer: string | undefined;
    readonly flags: readonly FlagDefinition[] | undefined;
    readonly cooldown: number | undefined;
}

class NormalizedCommandTag implements ICommand<NamedGuildCommandTag> {
    public readonly name: string;
    public readonly aliases: readonly string[];
    public readonly category: string;
    public readonly description: string | undefined;
    public readonly flags: readonly FlagDefinition[];
    public readonly signatures: readonly CommandSignature[];
    public readonly disabled: boolean;
    public readonly permission: string;
    public readonly roles: readonly string[];
    public readonly hidden: boolean;

    public constructor(
        public readonly implementation: NamedGuildCommandTag,
        public readonly tag: StoredTag | undefined
    ) {
        this.name = implementation.name;
        this.aliases = [];
        this.category = 'Custom';
        this.description = implementation.help ?? '_No help set_';
        this.flags = tag?.flags ?? ('flags' in implementation ? implementation.flags : []) ?? [];
        this.signatures = [];
        this.disabled = this.implementation.disabled ?? false;
        this.permission = this.implementation.permission ?? '0';
        this.roles = this.implementation.roles ?? [];
        this.hidden = this.implementation.hidden ?? false;
    }

    public async execute(context: CommandContext): Promise<undefined> {
        if (!guard.isGuildCommandContext(context))
            return;

        const details = await this.getDetails(context);
        if (typeof details === 'string') {
            await context.reply(details);
            return;
        }

        const { content, ...options } = details;

        metrics.commandCounter.labels('custom', 'custom').inc();
        await context.cluster.bbtag.execute(content, {
            ...options,
            authorId: options.author,
            authorizerId: options.authorizer,
            rootTagName: context.commandName,
            message: context.message,
            inputRaw: context.argsString,
            isCC: true,
            limit: 'customCommandLimit'
        });
        return undefined;
    }

    private async getDetails(context: CommandContext): Promise<string | CustomCommandDetails> {
        if (!guard.isGuildImportedCommandTag(this.implementation)) {
            return {
                author: this.implementation.author,
                authorizer: this.implementation.authorizer,
                content: this.implementation.content,
                cooldown: this.implementation.cooldown,
                flags: this.implementation.flags,
                tagVars: false
            };
        }

        if (this.implementation.author === this.tag?.author) {
            await context.database.tags.incrementUses(this.tag.name);
            const cooldown = Math.max(this.tag.cooldown ?? 0, this.implementation.cooldown ?? 0);
            return {
                author: this.tag.author,
                authorizer: this.tag.authorizer,
                content: this.tag.content,
                cooldown: cooldown <= 0 ? undefined : cooldown,
                flags: this.tag.flags,
                tagVars: true
            };
        }

        const oldAuthor = await context.util.getUser(this.implementation.author);
        if (this.tag === undefined)
            return `❌ When the command \`${context.commandName}\` was imported, the tag \`${this.implementation.alias}\` ` +
                `was owned by **${humanize.fullName(oldAuthor)}** (${this.implementation.author}) but it no longer exists. ` +
                'To continue using this command, please re-create the tag and re-import it.';

        const newAuthor = await context.util.getUser(this.tag.author);
        return `❌ When the command \`${context.commandName}\` was imported, the tag \`${this.implementation.alias}\` ` +
            `was owned by **${humanize.fullName(oldAuthor)}** (${this.implementation.author}) but it is ` +
            `now owned by **${humanize.fullName(newAuthor)}** (${this.tag.author}). ` +
            'If this is acceptable, please re-import the tag to continue using this command.';
    }
}
