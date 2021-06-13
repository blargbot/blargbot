import { AnyMessage, GuildMessage } from 'eris';
import { limits } from '../../core/bbtag';
import { BaseCommand, CommandContext } from '../../core/command';
import { metrics } from '../../core/Metrics';
import { Timer } from '../../structures/Timer';
import { commandTypes, guard, parse } from '../../utils';
import { Cluster } from '../Cluster';
import { tryHandleCleverbot } from './cleverbot';


export async function tryHandleCommand(cluster: Cluster, msg: AnyMessage): Promise<boolean> {
    const { prefix, isMention } = await getPrefix(cluster, msg) ?? {};
    if (prefix === undefined)
        return false;

    const blacklistReason = await cluster.database.users.getSetting(msg.author.id, 'blacklisted');
    if (blacklistReason) {
        await cluster.util.send(msg, `You have been blacklisted from the bot for the following reason: ${blacklistReason}`);
        return true;
    }

    const context = new CommandContext(cluster, msg, prefix);
    if (await tryHandleCustomCommand(cluster, context) || await tryHandleDefaultCommand(cluster, context)) {
        if (guard.isGuildMessage(msg))
            void handleDeleteNotif(cluster, msg);
        return true;
    }

    if (isMention)
        return await tryHandleCleverbot(cluster, msg);

    return false;
}

async function getPrefix(cluster: Cluster, msg: AnyMessage): Promise<undefined | { prefix: string, isMention: boolean }> {
    const guildPrefixes = await getGuildPrefixes(cluster, msg);
    const userPrefixes = await cluster.database.users.getSetting(msg.author.id, 'prefixes') ?? [];
    const defaultPrefixes = [cluster.config.discord.defaultPrefix, cluster.discord.user.username];
    const mentionPrefixes = [`<@${cluster.discord.user.id}>`, `<@!${cluster.discord.user.id}>`];

    const prefix = [...guildPrefixes, ...userPrefixes, ...defaultPrefixes, ...mentionPrefixes]
        .sort((a, b) => b.length - a.length)
        .find(p => msg.content.startsWith(p));

    return prefix !== undefined
        ? { prefix, isMention: mentionPrefixes.includes(prefix) }
        : undefined;
}

async function getGuildPrefixes(cluster: Cluster, msg: AnyMessage): Promise<readonly string[]> {
    if (!guard.isGuildMessage(msg))
        return [];

    const guildPrefixes = await cluster.database.guilds.getSetting(msg.channel.guild.id, 'prefix');
    if (guildPrefixes === undefined)
        return [];

    if (typeof guildPrefixes === 'string')
        return [guildPrefixes];

    return guildPrefixes;
}

async function tryHandleCustomCommand(cluster: Cluster, context: CommandContext): Promise<boolean> {
    if (!guard.isGuildCommandContext(context))
        return false;

    const command = await cluster.database.guilds.getCommand(context.channel.guild.id, context.commandName);
    if (command === undefined || !await cluster.util.canExecuteCustomCommand(context, command, true))
        return false;

    const { authorizer, alias } = command;
    let { content, flags, cooldown, author } = command;
    if (alias) {
        ({ content = '', flags, cooldown, author } = await cluster.database.tags.get(alias) ?? {});
    }

    if (!content)
        return false;

    cluster.logger.command(`Custom command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`);

    if (alias !== undefined) {
        await cluster.database.tags.incrementUses(alias);
    }
    await cluster.bbtag.execute(content, {
        message: context.message,
        tagName: context.commandName,
        limit: limits.CustomCommandLimit,
        flags,
        input: context.args,
        isCC: true,
        tagVars: alias !== undefined,
        cooldown,
        author,
        authorizer
    });
    metrics.commandCounter.labels('custom', 'custom').inc();

    return true;
}

async function tryHandleDefaultCommand(cluster: Cluster, context: CommandContext): Promise<boolean> {
    const command = cluster.commands.get(context.commandName);
    if (!command || !await cluster.util.canExecuteDefaultCommand(context, command))
        return false;

    try {
        const outputLog = guard.isGuildCommandContext(context)
            ? `Command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) on server ${context.channel.guild.name} (${context.channel.guild.id})`
            : `Command '${context.commandText}' executed by ${context.author.username} (${context.author.id}) in a PM (${context.channel.id}) Message ID: ${context.id}`;
        cluster.logger.command(outputLog);
        const timer = new Timer().start();
        await executeCommand(cluster, command, context);
        timer.end();
        metrics.commandLatency.labels(command.name, commandTypes.properties[command.category].name.toLowerCase()).observe(timer.elapsed);
        metrics.commandCounter.labels(command.name, commandTypes.properties[command.category].name.toLowerCase()).inc();
    } catch (err) {
        cluster.logger.error(err.stack);
        metrics.commandError.labels(command.name).inc();
    } finally {
        return true;
    }
}

async function executeCommand(cluster: Cluster, command: BaseCommand, context: CommandContext): Promise<void> {
    try {
        await command.execute(context);
    } catch (err) {
        cluster.logger.error(err);
        if (err.code === 50001 && !(await cluster.database.users.get(context.author.id))?.dontdmerrors) {
            if (!guard.isGuildChannel(context.channel))
                void cluster.util.sendDM(context.author,
                    'Oops, I dont seem to have permission to do that!');
            else
                void cluster.util.sendDM(context.author,
                    'Hi! You asked me to do something, but I didn\'t have permission to do it! Please make sure I have permissions to do what you asked.\n' +
                    `Guild: ${context.channel.guild.name}\n` +
                    `Channel: ${context.channel.name}\n` +
                    `Command: ${context.commandText}\n` +
                    '\n' +
                    'If you wish to stop seeing these messages, do the command `dmerrors`.');
        }
        throw err;
    }
}

async function handleDeleteNotif(cluster: Cluster, msg: GuildMessage): Promise<void> {
    const deleteNotif = await cluster.database.guilds.getSetting(msg.channel.guild.id, 'deletenotif');
    if (parse.boolean(deleteNotif, false, true))
        cluster.util.commandMessages.push(msg.channel.guild.id, msg.id);
}