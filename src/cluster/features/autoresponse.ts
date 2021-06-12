import { AnyMessage, GuildMessage } from 'eris';
import { limits, RuntimeLimit } from '../../core/bbtag';
import { guard, humanize } from '../../utils';
import { Cluster } from '../Cluster';
import { AutoResponseWhitelistInterval } from '../services/AutoResponseWhitelistInterval';


export async function handleAutoresponse(cluster: Cluster, msg: AnyMessage, everything: boolean): Promise<void> {
    if (msg.author.discriminator === '0000' || !guard.isGuildMessage(msg))
        return;

    const whitelist = cluster.services.get(AutoResponseWhitelistInterval.name, AutoResponseWhitelistInterval);
    if (!whitelist?.guilds.has(msg.channel.guild.id))
        return;

    for await (const { commandName, limit, silent = false } of findAutoresponses(cluster, msg, everything)) {
        const tag = await cluster.database.guilds.getCommand(msg.channel.id, commandName);
        if (tag !== undefined) {
            await cluster.bbtag.execute(tag.content, {
                message: msg,
                limit,
                author: tag.author,
                input: humanize.smartSplit(msg.content),
                isCC: true,
                tagName: commandName,
                silent
            });
        }
    }
}

async function* findAutoresponses(cluster: Cluster, msg: GuildMessage, everything: boolean): AsyncGenerator<{ commandName: string, limit: RuntimeLimit, silent?: boolean }> {
    const ars = await cluster.database.guilds.getAutoresponses(msg.channel.guild.id);
    if (everything) {
        if (ars.everything)
            yield { commandName: ars.everything.executes, limit: new limits.EverythingAutoResponseLimit(), silent: true };
        return;
    }

    if (ars.list === undefined)
        return;

    for (const ar of ars.list) {
        if (guard.testMessageFilter(ar, msg)) {
            yield { commandName: ar.executes, limit: new limits.GeneralAutoResponseLimit() };
        }
    }
}