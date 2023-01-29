import type { ExecutionResult } from '@blargbot/bbtag';
import type { Cluster } from '@blargbot/cluster';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import { guard } from '@blargbot/core/utils/index.js';
import type { GuildRolemeEntry } from '@blargbot/domain/models/index.js';
import { hasValue } from '@blargbot/guards';
import type * as Eris from 'eris';

import templates from '../text.js';

export class RolemeManager {
    readonly #cluster: Cluster;

    public constructor(
        cluster: Cluster
    ) {
        this.#cluster = cluster;
    }

    public async execute(message: Eris.KnownMessage): Promise<void> {
        if (!guard.isGuildMessage(message) || !hasValue(message.member))
            return;

        const rolemes = await this.#cluster.database.guilds.getRolemes(message.channel.guild.id);
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
                const newRoleList = [...roleList];
                await message.member.edit({ roles: newRoleList });
                message.member.roles = newRoleList;
                await this.invokeMessage(message, roleme);

            } catch (err: unknown) {
                await this.#cluster.util.reply(message, new FormattableMessageContent({ content: templates.roleme.failed }));
            }
        }
    }

    public async invokeMessage(trigger: Eris.Message<Eris.KnownGuildTextableChannel>, roleme: GuildRolemeEntry): Promise<ExecutionResult> {
        const tag = roleme.output ?? {
            content: 'Your roles have been edited!',
            author: ''
        };

        return await this.#cluster.bbtag.execute(tag.content, {
            message: trigger as never,
            rootTagName: 'roleme',
            limit: 'customCommandLimit',
            inputRaw: '',
            isCC: true,
            authorId: tag.author ?? undefined,
            authorizerId: tag.authorizer ?? undefined
        });
    }
}
