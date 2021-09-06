import { Cluster } from '@cluster';
import { CommandContext } from '@cluster/command';
import { CommandGetCoreResult, CommandGetResult, ICommand, ICommandManager, PermissionCheckResult } from '@cluster/types';
import { defaultStaff, guard, humanize } from '@cluster/utils';
import { MessageIdQueue } from '@core/MessageIdQueue';
import { CommandPermissions } from '@core/types';
import { parse } from '@core/utils';
import { Guild, Message, PartialMessage, Permissions, TextBasedChannels, User } from 'discord.js';

export abstract class BaseCommandManager<T> implements ICommandManager<T> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #commandMessages: MessageIdQueue;
    public abstract readonly size: number;

    protected constructor(
        public readonly type: string,
        protected readonly cluster: Cluster,
        messageQueueSize = 100
    ) {
        this.#commandMessages = new MessageIdQueue(messageQueueSize);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public load(_commands?: Iterable<string> | boolean): Promise<void> { return Promise.resolve(); }
    protected abstract getCore(name: string, location?: Guild | TextBasedChannels, user?: User): Promise<CommandGetCoreResult<T>>;
    protected abstract allCommandNames(location?: Guild | TextBasedChannels): AsyncIterable<string> | Iterable<string> | Promise<Iterable<string>>;
    public abstract configure(user: User, names: string[], guild: Guild, permissions: Partial<CommandPermissions>): Promise<readonly string[]>;

    public async execute(context: CommandContext): Promise<boolean> {
        const result = await this.get(context.commandName, context.channel, context.author);
        switch (result.state) {
            case 'ALLOWED': {
                const outputLog = guard.isGuildCommandContext(context)
                    ? `${this.type} command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`
                    : `${this.type} command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) in a PM (${context.channel.id}) Message ID: ${context.id}`;
                this.cluster.logger.command(outputLog);

                if (guard.isGuildCommandContext(context))
                    this.#commandMessages.push(context.channel.guild.id, context.message.channel.id);

                await context.channel.sendTyping();
                await result.detail.execute(context);
                return true;
            }
            case 'DISABLED':
            case 'NOT_FOUND':
            case 'NOT_IN_GUILD':
                return false;
            case 'BLACKLISTED':
                await context.reply(`❌ You have been blacklisted from the bot for the following reason: ${result.detail}`);
                return true;
            case 'MISSING_ROLE':
                await context.reply(`❌ You need the role ${humanize.smartJoin(result.detail.map(r => `<@&${r}>`), ', ', ' or ')} in order to use this command!`);
                return true;
            case 'MISSING_PERMISSIONS': {
                const permissions = new Permissions(result.detail);
                await context.reply(`❌ You need permission to ${permissions.bitfield} in order to use this command!`);
                return true;
            }
        }
    }

    public async get(name: string, location?: Guild | TextBasedChannels, user?: User): Promise<CommandGetResult<T>> {
        const result = await this.getCore(name, location, user);
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
        permissions?: CommandPermissions
    ): Promise<PermissionCheckResult> {
        if (this.cluster.util.isBotOwner(user.id))
            return { state: 'ALLOWED' };

        const blacklistReason = await this.cluster.database.users.getSetting(user.id, 'blacklisted');
        if (blacklistReason !== undefined)
            return { state: 'BLACKLISTED', detail: blacklistReason };

        if (permissions?.disabled === true)
            // Command is disabled
            return { state: 'DISABLED' };

        const [guild, channel] = location instanceof Guild ? [location, undefined]
            : guard.isGuildChannel(location) ? [location.guild, location]
                : [undefined, location];

        if (guild === undefined)
            // Dms have no command restrictions
            return { state: 'ALLOWED' };

        const member = await this.cluster.util.getMember(guild, user.id);
        if (member === undefined)
            // User isnt in the guild and so cannot use commands
            return { state: 'NOT_IN_GUILD' };

        if (guild.ownerId === user.id)
            // Guild owners can use all commands
            return { state: 'ALLOWED' };

        const permOverride = await this.cluster.util.database.guilds.getSetting(guild.id, 'permoverride');
        if (permOverride === true) {
            const staffPerms = parse.bigint(await this.cluster.util.database.guilds.getSetting(guild.id, 'staffperms') ?? defaultStaff);
            if (staffPerms !== undefined && this.cluster.util.hasPerms(member, staffPerms))
                // User has any of the permissions that identify them as a staff member
                return { state: 'ALLOWED' };
        }

        let result: PermissionCheckResult = { state: 'ALLOWED' };
        if (permissions?.permission !== undefined) {
            // User has any of the permissions for this command
            const perm = parse.bigint(permissions.permission);
            if (perm !== undefined) {
                if (this.cluster.util.hasPerms(member, perm))
                    return { state: 'ALLOWED' };
                result = { state: 'MISSING_PERMISSIONS', detail: perm };
            }
        }

        const adminrole = await this.cluster.util.database.guilds.getSetting(member.guild.id, 'adminrole');
        const roles = [adminrole, ...permissions?.roles ?? []].filter(guard.hasValue);
        if (roles.length > 0) {
            // User has one of the roles this command is linked to or the admin role?
            if (await this.cluster.util.hasRoles(member, roles, channel))
                return { state: 'ALLOWED' };
            result = { state: 'MISSING_ROLE', detail: roles };
        }

        return result;
    }
}
