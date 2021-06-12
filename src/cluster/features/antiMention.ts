import { AnyMessage } from 'eris';
import { guard } from '../../utils';
import { Cluster } from '../Cluster';

export async function handleAntiMention(cluster: Cluster, msg: AnyMessage): Promise<void> {
    if (!guard.isGuildMessage(msg))
        return;

    const antimention = await cluster.database.guilds.getSetting(msg.channel.guild.id, 'antimention');
    if (antimention === undefined)
        return;

    const parsedAntiMention = typeof antimention === 'string' ? parseInt(antimention) : antimention;
    if (parsedAntiMention === 0 || isNaN(parsedAntiMention) || msg.mentions.length < parsedAntiMention)
        return;

    cluster.util.bans.set(msg.channel.guild.id, msg.author.id, {
        mod: cluster.discord.user,
        type: 'Auto-Ban',
        reason: 'Mention spam'
    });

    try {
        await cluster.discord.banGuildMember(msg.channel.guild.id, msg.author.id, 1);
    } catch (err) {
        cluster.util.bans.clear(msg.channel.guild.id, msg.author.id);
        await cluster.util.send(msg, `${msg.author.username} is mention spamming, but I lack the permissions to ban them!`);
    }
}