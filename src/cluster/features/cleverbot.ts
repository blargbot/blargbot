import { AnyMessage } from 'eris';
import request from 'request';
import { metrics } from '../../core/Metrics';
import { guard, sleep } from '../../utils';
import { Cluster } from '../Cluster';

export async function tryHandleCleverbot(cluster: Cluster, msg: AnyMessage): Promise<boolean> {
    if (!guard.isGuildMessage(msg) || await cluster.database.guilds.getSetting(msg.channel.guild.id, 'nocleverbot'))
        return false;

    void handleCleverbot(cluster, msg);
    return true;
}

async function handleCleverbot(cluster: Cluster, msg: AnyMessage): Promise<void> {
    await cluster.discord.sendChannelTyping(msg.channel.id);
    let username = cluster.discord.user.username;
    if (guard.isGuildMessage(msg)) {
        const member = msg.channel.guild.members.get(cluster.discord.user.id);
        if (member?.nick)
            username = member.nick;
    }

    const msgToSend = msg.content.replace(new RegExp('@' + '\u200b' + username + ',?'), '').trim();
    metrics.cleverbotStats.inc();
    try {
        const response = await queryCleverbot(cluster, msgToSend);
        await sleep(1500);
        await cluster.util.send(msg, response);
    } catch (err) {
        cluster.logger.error(err);
        await cluster.util.send(msg, 'Failed to contact the API. Blame cleverbot.io');
    }
}

async function queryCleverbot(cluster: Cluster, input: string): Promise<string> {
    return await new Promise<string>((res, rej) => {
        request.post(cluster.config.cleverbot.endpoint, { form: { input } }, (err, _, bod: string) => {
            if (err) rej(err);
            else {
                const content = /<font size="2" face="Verdana" color=darkred>(.+)<\/font>/.exec(bod);
                if (content)
                    return res(content[1].replace(/(\W)alice(\W)/gi, '$1blargbot$2').replace(/<br>/gm, '\n'));
                res('Hi, I\'m blargbot! It\'s nice to meet you.');
            }
        });
    });
}