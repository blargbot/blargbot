import { AnyMessage } from 'eris';
import { limits } from '../../core/bbtag';
import { guard, humanize, ModerationType, modlogColour } from '../../utils';
import { Cluster } from '../Cluster';

export async function handleCensor(cluster: Cluster, msg: AnyMessage): Promise<void> {
    if (!guard.isGuildMessage(msg))
        return;

    const censor = await cluster.database.guilds.getCensors(msg.channel.guild.id);
    if (!censor?.list?.length)
        return;

    //First, let's check exceptions
    const { channel, user, role } = censor.exception ?? {};
    if ((channel?.includes(msg.channel.id))
        || (user?.includes(msg.author.id))
        || (role?.length && msg.member && cluster.util.hasRole(msg.member, role)))
        return;

    for (const cens of censor.list) {
        if (!guard.testMessageFilter(cens, msg))
            continue;

        const res = await cluster.util.moderation.issueWarning(msg.author, msg.channel.guild, cens.weight);
        if (cens.weight > 0) {
            await cluster.util.moderation.logAction(
                msg.channel.guild,
                msg.author,
                cluster.discord.user,
                'Auto-Warning',
                cens.reason || 'Said a blacklisted phrase.',
                modlogColour.WARN,
                [
                    {
                        name: 'Warnings',
                        value: `Assigned: ${cens.weight}\nNew Total: ${res?.count || 0}`,
                        inline: true
                    }
                ]);
        }
        try {
            await msg.delete();
        } catch (err) {
            // bu.send(msg, `${bu.getFullName(msg.author)} said a blacklisted word, but I was not able to delete it.`);
        }
        let content = '';
        switch (res?.type) {
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
            limit: limits.CustomCommandLimit,
            input: humanize.smartSplit(msg.content),
            isCC: true,
            author: ''
        });
    }
}



