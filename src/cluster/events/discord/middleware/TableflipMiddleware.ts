import { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities';
import { guard } from '@blargbot/cluster/utils';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

import templates from '../../../text';

export class TableflipMiddleware implements IMiddleware<KnownMessage, boolean> {
    readonly #util: ClusterUtilities;

    public constructor(util: ClusterUtilities) {
        this.#util = util;
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const result = next();
        const flipDir = context.content.includes('(╯°□°）╯︵ ┻━┻') ? 'unflip'
            : context.content.includes('┬─┬ ノ( ゜-゜ノ)') ? 'flip'
                : undefined;

        if (flipDir === undefined)
            return await result;

        if (guard.isGuildMessage(context) && await this.#util.database.guilds.getSetting(context.channel.guild.id, 'tableflip') === false)
            return await result;

        await this.#util.reply(context, new FormattableMessageContent({ content: templates.tableflip[flipDir] }));
        return await result;
    }
}
