import type { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities.js';
import { guard } from '@blargbot/cluster/utils/index.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import { hasValue } from '@blargbot/guards';
import type * as Eris from 'eris';

export class ChannelBlacklistMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    readonly #util: ClusterUtilities;

    public constructor(util: ClusterUtilities) {
        this.#util = util;
    }

    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (!guard.isGuildMessage(context))
            return await next();

        if (await this.#util.database.guilds.getChannelSetting(context.channel.guild.id, context.channel.id, 'blacklisted') !== true)
            return await next();

        if (hasValue(context.member) && await this.#util.isUserStaff(context.member))
            return await next();

        return false;
    }
}