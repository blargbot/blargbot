import type { ClusterUtilities } from '@blargbot/cluster/ClusterUtilities.js';
import { guard } from '@blargbot/cluster/utils/index.js';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type * as Eris from 'eris';

import templates from '../../../text.js';

export class TableflipMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    readonly #util: ClusterUtilities;

    public constructor(util: ClusterUtilities) {
        this.#util = util;
    }

    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
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
