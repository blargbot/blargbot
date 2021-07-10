import { AnyMessage, DiscordRESTError, PossiblyUncachedMessage } from 'eris';
import { Cluster } from '../Cluster';
import { BaseCommand, CanExecuteCustomCommandOptions, CanExecuteDefaultCommandOptions, CommandContext, commandTypes, CustomCommandLimit, defaultStaff, FlagDefinition, guard, GuildCommandContext, humanize, MessageIdQueue, metrics, ModuleLoader, StoredAliasedGuildCommand, StoredGuildCommand, StoredRawGuildCommand, Timer } from '../core';

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

    public init(): Promise<void> {
        this.cluster.discord.on('messageDelete', message => void this.handleMessageDelete(message));
        return super.init();
    }

    public async tryExecute(message: AnyMessage): Promise<boolean> {
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

    public async canExecuteCustomCommand(context: GuildCommandContext, command: StoredGuildCommand, options: CanExecuteCustomCommandOptions = {}): Promise<boolean> {
        return command.hidden !== true
            && (command.roles === undefined || await this.cluster.util.hasRoles(context.message, command.roles, options.quiet ?? false));
    }

    public async canExecuteDefaultCommand(context: CommandContext, command: BaseCommand, options: CanExecuteDefaultCommandOptions = {}): Promise<boolean> {
        if (command.onlyOn !== undefined && (!guard.isGuildCommandContext(context) || command.onlyOn !== context.channel.guild.id))
            return false; // Command only works on the specific guild

        if (context.author.id === this.cluster.config.discord.users.owner)
            return true; // The owner can execute any command anywhere

        const category = commandTypes.properties[command.category];
        if (!await category.requirement(context))
            return false; // Context doesnt meet the category requirements

        if (!guard.isGuildCommandContext(context))
            return true; // No configurable restrictions outside of guilds

        const commandPerms = await this.cluster.database.guilds.getCommandPerms(context.channel.guild.id, command.name);
        if (commandPerms?.disabled === true && !command.cannotDisable)
            return false; // Command is disabled

        const permOverride = options.permOverride ?? await this.cluster.database.guilds.getSetting(context.channel.guild.id, 'permoverride');
        if (permOverride === true) {
            const staffPerms = options.staffPerms ?? await this.cluster.database.guilds.getSetting(context.channel.guild.id, 'staffperms') ?? defaultStaff;
            const allow = typeof staffPerms === 'number' ? staffPerms : parseInt(staffPerms);
            if (!isNaN(allow) && this.cluster.util.hasPerms(context.message.member, allow))
                return true; // User has any of the permissions that identify them as a staff member
        }

        if (commandPerms !== undefined) {
            if (commandPerms.permission !== undefined && this.cluster.util.hasPerms(context.message.member, commandPerms.permission))
                return true; // User has any of the permissions for this command

            switch (typeof commandPerms.rolename) {
                case 'undefined': break;
                // User has one of the roles this command is linked to?
                case 'string': return await this.cluster.util.hasRoles(context.message, [commandPerms.rolename], options.quiet ?? false);
                case 'object': return await this.cluster.util.hasRoles(context.message, commandPerms.rolename, options.quiet ?? false);
            }
        }

        const adminrole = await this.cluster.database.guilds.getSetting(context.channel.guild.id, 'adminrole');
        if (adminrole !== undefined)
            // User has the configured admin role?
            return await this.cluster.util.hasRoles(context.message, [adminrole], options.quiet ?? false);

        if (category.defaultPerms !== undefined)
            // User has any of the permissions declared by the category?
            return this.cluster.util.hasPerms(context.message.member, category.defaultPerms);

        return true;
    }

    private async getPrefix(message: AnyMessage): Promise<undefined | string> {
        const guildPrefixes = await this.getGuildPrefixes(message);
        const userPrefixes = await this.cluster.database.users.getSetting(message.author.id, 'prefixes') ?? [];
        const defaultPrefixes = [this.cluster.config.discord.defaultPrefix, this.cluster.discord.user.username];
        const mentionPrefixes = [`<@${this.cluster.discord.user.id}>`, `<@!${this.cluster.discord.user.id}>`];

        return [...guildPrefixes, ...userPrefixes, ...defaultPrefixes, ...mentionPrefixes]
            .sort((a, b) => b.length - a.length)
            .find(p => message.content.startsWith(p));
    }

    private async getGuildPrefixes(message: AnyMessage): Promise<readonly string[]> {
        if (!guard.isGuildMessage(message))
            return [];

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
            metrics.commandLatency.labels(command.name, commandTypes.properties[command.category].name.toLowerCase()).observe(timer.elapsed);
            metrics.commandCounter.labels(command.name, commandTypes.properties[command.category].name.toLowerCase()).inc();
        } catch (err: unknown) {
            this.cluster.logger.error(err);
            metrics.commandError.labels(command.name).inc();
        }
        return true;
    }

    private async invokeCustomCommand(context: GuildCommandContext, command: StoredGuildCommand): Promise<void> {
        const commandDetails = guard.isAliasedCustomCommand(command)
            ? await this.tryResolveAliasedCustomCommand(context, command)
            : this.tryResolveRawCustomCommand(command);

        if (commandDetails === undefined || commandDetails.content.length === 0)
            return;

        this.cluster.logger.command(`Custom command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`);
        metrics.commandCounter.labels('custom', 'custom').inc();
        await this.cluster.bbtag.execute(commandDetails.content, {
            message: context.message,
            tagName: context.commandName,
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
            if (err instanceof DiscordRESTError) {
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

    private async tryResolveAliasedCustomCommand(context: GuildCommandContext, command: StoredAliasedGuildCommand): Promise<CommandDetails | undefined> {
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

    private tryResolveRawCustomCommand(command: StoredRawGuildCommand): CommandDetails {
        return {
            author: command.author,
            authorizer: command.authorizer,
            content: command.content,
            cooldown: command.cooldown,
            flags: command.flags,
            tagVars: false
        };
    }

    private async handleMessageDelete(message: PossiblyUncachedMessage): Promise<void> {
        const guildId = 'guild' in message.channel ? message.channel.guild.id : undefined;
        if (guildId === undefined
            || !this.#commandMessages.has(guildId, message.id)
            || await this.cluster.database.guilds.getSetting(guildId, 'deletenotif') !== true) {
            return;
        }

        let author: string | undefined;
        if ('author' in message)
            author = humanize.fullName(message.author);
        else {
            const chatlog = await this.cluster.database.chatlogs.get(message.id);
            if (chatlog !== undefined) {
                author = this.cluster.discord.users.get(chatlog.userid)?.username
                    ?? (await this.cluster.database.users.get(chatlog.userid))?.username;
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
