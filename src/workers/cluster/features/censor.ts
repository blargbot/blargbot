import { AnyMessage } from 'eris';
import { guard, ModlogColour, ModerationType, humanize, CustomCommandLimit } from '../core';
import { Cluster } from '../Cluster';

export async function handleCensor(cluster: Cluster, msg: AnyMessage): Promise<void> {
    if (!guard.isGuildMessage(msg))
        return;

    const censor = await cluster.database.guilds.getCensors(msg.channel.guild.id);
    if (censor?.list === undefined || censor.list.length === 0)
        return;

    //First, let's check exceptions
    const { channel = [], user = [], role = [] } = censor.exception ?? {};
    if (channel.includes(msg.channel.id)
        || user.includes(msg.author.id)
        || role.length > 0 && msg.member !== null && cluster.util.hasRole(msg.member, role))
        return;

    for (const cens of censor.list) {
        if (!guard.testMessageFilter(cens, msg))
            continue;

        const res = await cluster.moderation.issueWarning(msg.author, msg.channel.guild, cens.weight);
        if (cens.weight > 0) {
            await cluster.moderation.logAction(
                msg.channel.guild,
                msg.author,
                cluster.discord.user,
                'Auto-Warning',
                cens.reason ?? 'Said a blacklisted phrase.',
                ModlogColour.WARN,
                [
                    {
                        name: 'Warnings',
                        value: `Assigned: ${cens.weight}\nNew Total: ${res.count}`,
                        inline: true
                    }
                ]);
        }
        try {
            await msg.delete();
        } catch (err: unknown) {
            // bu.send(msg, `${bu.getFullName(msg.author)} said a blacklisted word, but I was not able to delete it.`);
        }
        let content = '';
        switch (res.type) {
            case ModerationType.KICK:
                content = cens.deleteMessage ?? censor.rule?.deleteMessage ?? ''; // TODO cant find the definition for the default messages
                break;
            case ModerationType.BAN:
                content = cens.banMessage ?? censor.rule?.banMessage ?? ''; // TODO cant find the definition for the default messages
                break;
            case ModerationType.WARN:
                content = cens.kickMessage ?? censor.rule?.kickMessage ?? ''; // TODO cant find the definition for the default messages
                break;
        }
        await cluster.bbtag.execute(content, {
            message: msg,
            tagName: 'censor',
            limit: new CustomCommandLimit(),
            input: humanize.smartSplit(msg.content),
            isCC: true,
            author: ''
        });
    }
}
