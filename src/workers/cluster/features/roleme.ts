import { Cluster } from '@cluster';
import { CustomCommandLimit } from '@cluster/bbtag';
import { guard } from '@cluster/utils';
import { AnyMessage } from 'eris';

export async function handleRoleme(cluster: Cluster, msg: AnyMessage): Promise<void> {
    if (!guard.isGuildMessage(msg))
        return;

    const roleme = await cluster.database.guilds.getRolemes(msg.channel.guild.id);
    if (roleme.length === 0)
        return;

    const rolemes = roleme.filter(m => m.channels.includes(msg.channel.id) || m.channels.length === 0);
    if (rolemes.length === 0)
        return;

    for (const roleme of rolemes) {
        let message = roleme.message;
        let content = msg.content;
        if (!roleme.casesensitive) {
            message = message.toLowerCase();
            content = content.toLowerCase();
        }
        if (message !== content)
            continue;

        const roleList = new Set(msg.member.roles);
        roleme.add?.forEach(r => roleList.add(r));
        roleme.remove?.forEach(r => roleList.add(r));

        try {
            await msg.member.edit({ roles: [...roleList] });
            cluster.logger.verbose(roleme.output);
            await cluster.bbtag.execute(roleme.output ?? 'Your roles have been edited!', {
                message: msg,
                tagName: 'roleme',
                limit: new CustomCommandLimit(),
                inputRaw: '',
                isCC: true,
                author: ''
            });
        } catch (err: unknown) {
            await cluster.util.send(msg, 'A roleme was triggered, but I don\'t have the permissions required to give you your role!');
        }
    }
}
