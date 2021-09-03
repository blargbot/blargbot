import { Cluster } from '@cluster';
import { CustomCommandLimit } from '@cluster/bbtag';
import { BaseCommand, CommandContext } from '@cluster/command';
import { CanExecuteCustomCommandOptions, CanExecuteDefaultCommandOptions, CommandPermissionContext, FlagDefinition, GuildCommandContext, GuildCommandPermissionContext } from '@cluster/types';
import { commandTypeDetails, defaultStaff, guard, humanize, parse } from '@cluster/utils';
import { MessageIdQueue } from '@core/MessageIdQueue';
import { metrics } from '@core/Metrics';
import { ModuleLoader } from '@core/modules';
import { Timer } from '@core/Timer';
import { CommandPermissions, GuildCommandTag, GuildImportedCommandTag, GuildSourceCommandTag } from '@core/types';
import { Channel, DiscordAPIError, Guild, GuildMember, Message, PartialMessage, PermissionString, TextBasedChannels } from 'discord.js';

export class CommandManager extends ModuleLoader<BaseCommand> {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #commandMessages: MessageIdQueue;

    public constructor(
        source: string,
        private readonly cluster: Cluster
    ) {
        super(source, BaseCommand, [cluster], cluster.logger, c => [c.name, ...c.aliases]);
        this.#commandMessages = new MessageIdQueue(100);
    }

    public async tryExecute(message: Message): Promise<boolean> {
        const prefix = await this.getPrefix(message);
        if (prefix === undefined)
            return false;

        const blacklistReason = await this.cluster.database.users.getSetting(message.author.id, 'blacklisted');
        if (blacklistReason !== undefined) {
            await this.cluster.util.send(message.channel, `You have been blacklisted from the bot for the following reason: ${blacklistReason}`);
            return true;
        }

        const context = new CommandContext(this.cluster, message, prefix);
        if (await this.tryHandleCustomCommand(context) || await this.tryHandleDefaultCommand(context)) {
            if (guard.isGuildMessage(message) && await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'deletenotif') === true)
                this.#commandMessages.push(message.channel.guild.id, message.id);
            return true;
        }

        return false;
    }

    public async hasPermissions(
        context: CommandPermissionContext,
        member: GuildMember,
        permissions: CommandPermissions,
        channel?: TextBasedChannels,
        permOverride?: boolean,
        staffPerms?: bigint | string | readonly PermissionString[]
    ): Promise<boolean | undefined> {
        if (member.guild.ownerId === member.id || context.util.isBotOwner(member.id))
            return true;

        if (permissions.disabled === true)
            // Command is disabled
            return false;

        permOverride ??= await context.util.database.guilds.getSetting(member.guild.id, 'permoverride');
        if (permOverride === true) {
            staffPerms ??= await context.util.database.guilds.getSetting(member.guild.id, 'staffperms') ?? defaultStaff;
            const allow = typeof staffPerms === 'string' ? parse.bigint(staffPerms) : staffPerms;
            if ((typeof allow === 'bigint' || allow !== undefined && allow.length > 0) && context.util.hasPerms(member, allow))
                // User has any of the permissions that identify them as a staff member
                return true;
        }

        if (guard.hasValue(permissions.permission) && context.util.hasPerms(member, permissions.permission))
            // User has any of the permissions for this command
            return true;

        if (Array.isArray(permissions.roles))
            // User has one of the roles this command is linked to?
            return await context.util.hasRoles(member, permissions.roles, channel);

        const adminrole = await context.util.database.guilds.getSetting(member.guild.id, 'adminrole');
        if (adminrole !== undefined)
            // User has the configured admin role?
            return await context.util.hasRoles(member, [adminrole], channel);

        return undefined;
    }

    public async canExecuteCustomCommand(context: GuildCommandPermissionContext, command: GuildCommandTag, options: CanExecuteCustomCommandOptions = {}): Promise<boolean> {
        const { location, author } = context;
        const [guild, channel] = location instanceof Guild ? [location, undefined] : [location.guild, location];
        const member = await this.cluster.util.getMember(guild, author.id);
        if (member === undefined)
            return false; // User isnt a member of this guild

        return await this.hasPermissions(context, member, command, options.quiet !== true ? channel : undefined, undefined, undefined) ?? true;
    }

    public async canExecuteDefaultCommand(context: CommandPermissionContext, command: BaseCommand, options: CanExecuteDefaultCommandOptions = {}): Promise<boolean> {
        const { location, author } = context;
        if (command.onlyOn !== null) {
            const ids = [location.id];
            if (location instanceof Channel && guard.isGuildChannel(location))
                ids.push(location.guild.id);

            if (!ids.includes(command.onlyOn))
                return false; // Command only works on the specific guild/channel
        }

        const category = commandTypeDetails[command.category];
        if (!await category.requirement(context))
            return false; // Context doesnt meet the category requirements

        const [guild, channel] = location instanceof Guild ? [location, undefined]
            : guard.isGuildChannel(location) ? [location.guild, location]
                : [undefined, location];

        if (guild === undefined)
            return true; // No configurable restrictions outside of guilds

        const member = await this.cluster.util.getMember(guild, author.id);
        if (member === undefined)
            return false; // User isnt a member of this guild

        const commandPerms = { ...await this.cluster.database.guilds.getCommandPerms(guild.id, command.name) };
        if (command.cannotDisable)
            commandPerms.disabled = false;

        const hasPerms = await this.hasPermissions(context, member, commandPerms, options.quiet !== true ? channel : undefined, options.permOverride, options.staffPerms);
        if (typeof hasPerms === 'boolean')
            return hasPerms;

        if (category.defaultPerms !== undefined)
            // User has any of the permissions declared by the category?
            return this.cluster.util.hasPerms(member, category.defaultPerms);

        return true;
    }

    private async getPrefix(message: Message): Promise<undefined | string> {
        const contextPrefixes = await this.getContextPrefixes(message);
        const userPrefixes = await this.cluster.database.users.getSetting(message.author.id, 'prefixes') ?? [];
        const defaultPrefixes = [this.cluster.config.discord.defaultPrefix, this.cluster.discord.user.username];
        const mentionPrefixes = [`<@${this.cluster.discord.user.id}>`, `<@!${this.cluster.discord.user.id}>`];

        return [...contextPrefixes, ...userPrefixes, ...defaultPrefixes, ...mentionPrefixes]
            .sort((a, b) => b.length - a.length)
            .find(p => message.content.startsWith(p));
    }

    private async getContextPrefixes(message: Message): Promise<readonly string[]> {
        if (!guard.isGuildMessage(message))
            return [''];

        const guildPrefixes = await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'prefix');
        if (guildPrefixes === undefined)
            return [];

        if (typeof guildPrefixes === 'string')
            return [guildPrefixes];

        return guildPrefixes;
    }

    private async tryHandleCustomCommand(context: CommandContext): Promise<boolean> {
        if (!guard.isGuildCommandContext(context))
            return false;

        const command = await this.cluster.database.guilds.getCommand(context.channel.guild.id, context.commandName);
        if (command === undefined || !await this.canExecuteCustomCommand(context, command))
            return false;

        await this.invokeCustomCommand(context, command);
        return true;
    }

    private async tryHandleDefaultCommand(context: CommandContext): Promise<boolean> {
        const command = this.cluster.commands.get(context.commandName);
        if (command === undefined || !await this.canExecuteDefaultCommand(context, command))
            return false;

        try {
            const outputLog = guard.isGuildCommandContext(context)
                ? `Command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`
                : `Command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) in a PM (${context.channel.id}) Message ID: ${context.id}`;
            this.cluster.logger.command(outputLog);
            const timer = new Timer().start();
            await this.invokeDefaultCommand(command, context);
            timer.end();
            metrics.commandLatency.labels(command.name, commandTypeDetails[command.category].name.toLowerCase()).observe(timer.elapsed);
            metrics.commandCounter.labels(command.name, commandTypeDetails[command.category].name.toLowerCase()).inc();
        } catch (err: unknown) {
            this.cluster.logger.error(err);
            metrics.commandError.labels(command.name).inc();
        }
        return true;
    }

    private async invokeCustomCommand(context: GuildCommandContext, command: GuildCommandTag): Promise<void> {
        const commandDetails = guard.isGuildImportedCommandTag(command)
            ? await this.tryResolveAliasedCustomCommand(context, command)
            : this.tryResolveRawCustomCommand(command);

        if (commandDetails === undefined || commandDetails.content.length === 0)
            return;

        this.cluster.logger.command(`Custom command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`);
        metrics.commandCounter.labels('custom', 'custom').inc();
        await this.cluster.bbtag.execute(commandDetails.content, {
            message: context.message,
            rootTagName: context.commandName,
            isCC: true,
            inputRaw: context.argsString,
            limit: new CustomCommandLimit(),
            flags: commandDetails.flags,
            tagVars: commandDetails.tagVars,
            cooldown: commandDetails.cooldown,
            author: commandDetails.author,
            authorizer: commandDetails.authorizer
        });
    }

    private async invokeDefaultCommand(command: BaseCommand, context: CommandContext): Promise<void> {
        try {
            await command.execute(context);
        } catch (err: unknown) {
            this.cluster.logger.error(err);
            if (err instanceof DiscordAPIError) {
                if (err.code === 50001 && (await this.cluster.database.users.get(context.author.id))?.dontdmerrors !== true) {
                    if (!guard.isGuildChannel(context.channel))
                        void this.cluster.util.sendDM(context.author,
                            'Oops, I dont seem to have permission to do that!');
                    else
                        void this.cluster.util.sendDM(context.author,
                            'Hi! You asked me to do something, but I didn\'t have permission to do it! Please make sure I have permissions to do what you asked.\n' +
                            `Guild: ${context.channel.guild.name}\n` +
                            `Channel: ${context.channel.name}\n` +
                            `Command: ${context.commandText}\n` +
                            '\n' +
                            'If you wish to stop seeing these messages, do the command `dmerrors`.');
                }
            }
            throw err;
        }
    }

    private async tryResolveAliasedCustomCommand(context: GuildCommandContext, command: GuildImportedCommandTag): Promise<CommandDetails | undefined> {
        const author = await this.cluster.database.users.get(command.author);
        const tag = await this.cluster.database.tags.get(command.alias);
        if (tag === undefined) {
            await this.cluster.util.send(context.channel,
                `❌ When the command \`${context.commandName}\` was imported, the tag \`${command.alias}\` ` +
                `was owned by **${humanize.fullName(author)}** (${command.author}) but it no longer exists. ` +
                'To continue using this command, please re-create the tag and re-import it.');
            return undefined;
        }
        if (tag.author !== command.author) {
            const currentAuthor = await this.cluster.database.users.get(tag.author);
            await this.cluster.util.send(context.channel,
                `❌ When the command \`${context.commandName}\` was imported, the tag \`${command.alias}\` ` +
                `was owned by **${humanize.fullName(author)}** (${command.author}) but it is ` +
                `now owned by **${humanize.fullName(currentAuthor)}** (${tag.author}). ` +
                'If this is acceptable, please re-import the tag to continue using this command.');
            return undefined;
        }
        await this.cluster.database.tags.incrementUses(command.alias);
        const cooldown = Math.max(tag.cooldown ?? 0, command.cooldown ?? 0);
        return {
            author: tag.author,
            authorizer: command.authorizer,
            content: tag.content,
            cooldown: cooldown <= 0 ? undefined : cooldown,
            flags: tag.flags,
            tagVars: true
        };
    }

    private tryResolveRawCustomCommand(command: GuildSourceCommandTag): CommandDetails {
        return {
            author: command.author,
            authorizer: command.authorizer,
            content: command.content,
            cooldown: command.cooldown,
            flags: command.flags,
            tagVars: false
        };
    }

    public async messageDeleted(message: Message | PartialMessage): Promise<void> {
        const guildId = 'guild' in message.channel ? message.channel.guild.id : undefined;
        if (guildId === undefined
            || !this.#commandMessages.has(guildId, message.id)
            || await this.cluster.database.guilds.getSetting(guildId, 'deletenotif') !== true) {
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
}

interface CommandDetails {
    readonly content: string;
    readonly tagVars: boolean;
    readonly author: string;
    readonly authorizer: string | undefined;
    readonly flags: readonly FlagDefinition[] | undefined;
    readonly cooldown: number | undefined;
}
