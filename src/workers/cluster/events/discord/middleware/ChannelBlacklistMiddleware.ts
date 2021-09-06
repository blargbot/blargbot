import { ClusterUtilities } from '@cluster/ClusterUtilities';
import { guard } from '@cluster/utils';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class ChannelBlacklistMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly util: ClusterUtilities) {
    }

    public async execute(context: Message, next: () => Promise<boolean>): Promise<boolean> {
        if (!guard.isGuildMessage(context))
            return await next();

        if (await this.util.database.guilds.getChannelSetting(context.channel.guild.id, context.channel.id, 'blacklisted') !== true)
            return await next();

        if (await this.util.isUserStaff(context.member))
            return await next();

        return false;
    }
}
