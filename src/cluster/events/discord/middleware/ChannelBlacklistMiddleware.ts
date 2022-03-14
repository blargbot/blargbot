import { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities';
import { guard } from '@blargbot/cluster/utils';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

export class ChannelBlacklistMiddleware implements IMiddleware<KnownMessage, boolean> {
    public constructor(private readonly util: ClusterUtilities) {
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (!guard.isGuildMessage(context))
            return await next();

        if (await this.util.database.guilds.getChannelSetting(context.channel.guild.id, context.channel.id, 'blacklisted') !== true)
            return await next();

        if (await this.util.isUserStaff(context.member))
            return await next();

        return false;
    }
}
