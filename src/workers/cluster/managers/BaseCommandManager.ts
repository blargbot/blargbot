import { Cluster } from '@cluster';
import { CommandContext, InvokeCommandMiddleware } from '@cluster/command';
import { CommandGetCoreResult, CommandGetResult, CommandResult, ICommand, ICommandManager, PermissionCheckResult } from '@cluster/types';
import { defaultStaff, guard, humanize } from '@cluster/utils';
import { MessageIdQueue } from '@core/MessageIdQueue';
import { CommandPermissions, IMiddleware } from '@core/types';
import { parse, pluralise as p, runMiddleware } from '@core/utils';
import { Guild, Message, PartialMessage, TextBasedChannels, User } from 'discord.js';

export abstract class BaseCommandManager<T> implements ICommandManager<T> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #commandMessages: MessageIdQueue;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #handler: InvokeCommandMiddleware;
    public abstract readonly size: number;

    protected constructor(
        public readonly type: string,
        protected readonly cluster: Cluster,
        protected readonly middleware: ReadonlyArray<IMiddleware<CommandContext, CommandResult>> = [],
        messageQueueSize = 100
    ) {
        this.#commandMessages = new MessageIdQueue(messageQueueSize);
        this.#handler = new InvokeCommandMiddleware(this.type, this.#commandMessages, this.cluster.logger);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public load(_commands?: Iterable<string> | boolean): Promise<void> { return Promise.resolve(); }
    protected abstract getCore(name: string, location?: Guild | TextBasedChannels, user?: User): Promise<CommandGetCoreResult<T>>;
    protected abstract allCommandNames(location?: Guild | TextBasedChannels): AsyncIterable<string> | Iterable<string> | Promise<Iterable<string>>;
    public abstract configure(user: User, names: string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]>;

    public async execute(message: Message, prefix: string, middleware?: ReadonlyArray<IMiddleware<CommandContext, CommandResult>>): Promise<boolean> {
        const commandText = message.content.slice(prefix.length);
        const parts = humanize.smartSplit(commandText, 2);
        const commandName = parts[0].toLowerCase();
        const argsString = parts[1] ?? '';

        const result = await this.get(commandName, message.channel, message.author);
        switch (result.state) {
            case 'ALLOWED': {
                const context = new CommandContext(this.cluster, message, commandText, prefix, commandName, argsString, result.detail);
                const output = await runMiddleware<CommandContext, CommandResult>([
                    ...this.middleware,
                    ...middleware ?? [],
                    this.#handler
                ], context, undefined);
                if (output !== undefined) {
                    await context.reply(output);
                    return true;
                }

                return true;
            }
            case 'DISABLED':
            case 'NOT_FOUND':
            case 'NOT_IN_GUILD':
                return false;
            case 'BLACKLISTED':
                await this.cluster.util.send(message, `❌ You have been blacklisted from the bot for the following reason: ${result.detail}`);
                return true;
            case 'MISSING_ROLE':
                await this.cluster.util.send(message, `❌ You need the role ${humanize.smartJoin(result.detail.map(r => `<@&${r}>`), ', ', ' or ')} in order to use this command!`);
                return true;
            case 'MISSING_PERMISSIONS': {
                const permissions = humanize.permissions(result.detail, true).map(m => `- \`${m}\``);
                await this.cluster.util.send(message, `❌ You need ${p(permissions.length, 'the following permission', 'any of the following permissions')} to use this command:\n${permissions.join('\n')}`);
                return true;
            }
        }
    }

    public async get(name: string, location?: Guild | TextBasedChannels, user?: User): Promise<CommandGetResult<T>> {
        const result = await this.getCore(name.toLowerCase(), location, user);
        if (result.state !== 'FOUND')
            return result;

        if (user === undefined || location === undefined)
            return { state: 'ALLOWED', detail: result.detail };

        const permsResult = await this.checkPermissions(user, location, result.detail);
        if (permsResult.state !== 'ALLOWED')
            return permsResult;

        return { state: 'ALLOWED', detail: result.detail };
    }

    public async *list(location?: Guild | TextBasedChannels, user?: User): AsyncGenerator<ICommand<T>> {
        for await (const name of await this.allCommandNames(location)) {
            const result = await this.get(name, location, user);
            if (result.state === 'ALLOWED')
                yield result.detail;
        }
    }

    public async messageDeleted(message: Message | PartialMessage): Promise<void> {
        if (!guard.isGuildMessage(message))
            return;
        if (!this.#commandMessages.has(message.channel.guild.id, message.id)
            || await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'deletenotif') !== true) {
            return;
        }

        let author: string | undefined;
        if (!message.partial)
            author = humanize.fullName(message.author);
        else {
            const chatlog = await this.cluster.database.chatlogs.getByMessageId(message.id);
            if (chatlog !== undefined) {
                author = (await this.cluster.util.getUser(chatlog.userid))?.username;
            }
        }

        if (author !== undefined)
            await this.cluster.util.send(message.channel.id, `**${author}** deleted their command message.`);
    }

    protected async checkPermissions(
        user: User,
        location: Guild | TextBasedChannels,
        permissions: CommandPermissions
    ): Promise<PermissionCheckResult> {
        if (this.cluster.util.isBotOwner(user.id))
            return { state: 'ALLOWED' };

        const blacklistReason = await this.cluster.database.users.getSetting(user.id, 'blacklisted');
        if (blacklistReason !== undefined)
            return { state: 'BLACKLISTED', detail: blacklistReason };

        if (permissions.disabled === true)
            // Command is disabled
            return { state: 'DISABLED' };

        const guild = location instanceof Guild ? location
            : guard.isGuildChannel(location) ? location.guild
                : undefined;

        if (guild === undefined)
            // Dms have no command restrictions
            return { state: 'ALLOWED' };

        const member = await this.cluster.util.getMember(guild, user.id);
        if (member === undefined)
            // User isnt in the guild and so cannot use commands
            return { state: 'NOT_IN_GUILD' };

        if (guild.ownerId === user.id || member.permissions.has('ADMINISTRATOR'))
            // Guild owners/admins can use all commands
            return { state: 'ALLOWED' };

        const permOverride = await this.cluster.util.database.guilds.getSetting(guild.id, 'permoverride');
        if (permOverride === true) {
            const staffPerms = parse.bigint(await this.cluster.util.database.guilds.getSetting(guild.id, 'staffperms') ?? defaultStaff);
            if (staffPerms !== undefined && this.cluster.util.hasPerms(member, staffPerms))
                // User has any of the permissions that identify them as a staff member
                return { state: 'ALLOWED' };
        }

        let result: PermissionCheckResult = { state: 'ALLOWED' };
        if (permissions.permission !== undefined) {
            // User has any of the permissions for this command
            const perm = parse.bigint(permissions.permission);
            if (perm !== undefined) {
                if (this.cluster.util.hasPerms(member, perm))
                    return { state: 'ALLOWED' };
                result = { state: 'MISSING_PERMISSIONS', detail: perm };
            }
        }

        const adminrole = await this.cluster.util.database.guilds.getSetting(member.guild.id, 'adminrole');
        const roleIds = [adminrole, ...permissions.roles ?? []]
            .map(r => {
                if (r === undefined)
                    return undefined;

                const id = parse.entityId(r, '@&', true);
                if (id !== undefined)
                    return member.guild.roles.cache.get(id)?.id;

                const norm = r.toLowerCase();
                return member.guild.roles.cache.find(r => r.name.toLowerCase() === norm)?.id;
            }).filter(guard.hasValue);

        if (roleIds.length > 0) {
            // User has one of the roles this command is linked to or the admin role?
            if (member.roles.cache.hasAny(...roleIds))
                return { state: 'ALLOWED' };
            result = { state: 'MISSING_ROLE', detail: roleIds };
        }

        return result;
    }
}
