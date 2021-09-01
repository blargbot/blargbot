import { Cluster } from '@cluster';
import { guard, sleep } from '@cluster/utils';
import { metrics } from '@core/Metrics';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

export async function tryHandleCleverbot(cluster: Cluster, msg: Message): Promise<boolean> {
    if (!guard.isGuildMessage(msg)
        || !msg.content.replace(new RegExp('<@!?' + cluster.discord.user.id + '>'), cluster.discord.user.toString()).startsWith(cluster.discord.user.toString())
        || await cluster.database.guilds.getSetting(msg.channel.guild.id, 'nocleverbot') === true)
        return false;
    await handleCleverbot(cluster, msg);
    return true;
}

async function handleCleverbot(cluster: Cluster, msg: Message): Promise<void> {
    await msg.channel.sendTyping();
    // let username = cluster.discord.user.username;
    // if (guard.isGuildMessage(msg)) {
    //     const member = msg.channel.guild.me;
    //     if (member !== null && guard.hasValue(member.nickname))
    //         username = member.nickname;
    // }

    const msgToSend = msg.content.replace(new RegExp('<@!?' + cluster.discord.user.id + '>,?'), '').trim();
    metrics.cleverbotStats.inc();
    try {
        const response = await queryCleverbot(cluster, msgToSend);
        await sleep(1500);
        await cluster.util.send(msg, response);
    } catch (err: unknown) {
        cluster.logger.error(err);
        await cluster.util.send(msg, 'Failed to contact the API. Blame cleverbot.io');
    }
}

async function queryCleverbot(cluster: Cluster, input: string): Promise<string> {
    const form = new URLSearchParams();
    form.append('input', input);

    const result = await fetch(cluster.config.general.cleverbotApi, {
        method: 'POST',
        body: form
    });
    const content = /<font size="2" face="Verdana" color=darkred>(.+)<\/font>/.exec(await result.text());
    if (content !== null)
        return content[1].replace(/\balice\b/gi, 'blargbot').replace(/<br>/gm, '\n');
    return 'Hi, I\'m blargbot! It\'s nice to meet you.';
}
