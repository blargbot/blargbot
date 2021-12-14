import { Cluster } from '@cluster';
import { ExecutionResult } from '@cluster/types';
import { GuildRolemeEntry } from '@core/types';
import { guard } from '@core/utils';
import { KnownGuildTextableChannel, KnownMessage, Message } from 'eris';

export class RolemeManager {
    public constructor(
        private readonly cluster: Cluster
    ) {

    }

    public async execute(message: KnownMessage): Promise<void> {
        if (!guard.isGuildMessage(message))
            return;

        const rolemes = await this.cluster.database.guilds.getRolemes(message.channel.guild.id);
        for (const roleme of Object.values(rolemes ?? {})) {
            if (roleme === undefined)
                continue;
            if (roleme.channels.length > 0 && !roleme.channels.includes(message.channel.id))
                continue;
            if (message.content !== roleme.message && (roleme.casesensitive || message.content.toLowerCase() !== roleme.message.toLowerCase()))
                continue;

            const roleList = new Set(message.member.roles);
            roleme.add.forEach(r => roleList.add(r));
            roleme.remove.forEach(r => roleList.delete(r));

            try {
                await message.member.edit({ roles: [...roleList] });
                await this.invokeMessage(message, roleme);

            } catch (err: unknown) {
                await this.cluster.util.send(message, 'A roleme was triggered, but I don\'t have the permissions required to give you your role!');
            }
        }
    }

    public async invokeMessage(trigger: Message<KnownGuildTextableChannel>, roleme: GuildRolemeEntry): Promise<ExecutionResult> {
        const tag = roleme.output ?? {
            content: 'Your roles have been edited!',
            author: ''
        };

        return await this.cluster.bbtag.execute(tag.content, {
            message: trigger,
            rootTagName: 'roleme',
            limit: 'customCommandLimit',
            inputRaw: '',
            isCC: true,
            author: tag.author,
            authorizer: tag.authorizer
        });
    }
}