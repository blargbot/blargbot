import { Cluster } from '@blargbot/cluster';
import { CommandResult } from '@blargbot/cluster/types.js';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import { humanize, runMiddleware } from '@blargbot/core/utils/index.js';
import * as Eris from 'eris';

import { CommandContext } from '../../../command/index.js';
import templates from '../../../text.js';

export class CommandMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    readonly #cluster: Cluster;
    readonly #middleware: ReadonlyArray<IMiddleware<CommandContext, CommandResult>>;

    public constructor(
        cluster: Cluster,
        middleware: ReadonlyArray<IMiddleware<CommandContext, CommandResult>>
    ) {
        this.#cluster = cluster;
        this.#middleware = middleware;
    }

    public async execute(message: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const prefix = await this.#cluster.prefixes.findPrefix(message);
        if (prefix === undefined)
            return await next();

        const commandText = message.content.slice(prefix.length);
        const parts = humanize.smartSplit(commandText, 2);
        const commandName = (parts[0] ?? '').toLowerCase();
        const argsString = parts[1] ?? '';

        const result = await this.#cluster.commands.get(commandName, message.channel, message.author);
        switch (result.state) {
            case 'ALLOWED': {
                const context = new CommandContext(this.#cluster, message, commandText, prefix, commandName, argsString, result.detail.command);
                const output = await runMiddleware([...this.#middleware, result.detail.command], context, next, () => undefined);
                if (output !== undefined)
                    await context.reply(output);

                return true;
            }
            case 'DISABLED':
            case 'NOT_FOUND':
            case 'NOT_IN_GUILD':
                return await next();
            case 'BLACKLISTED':
                await this.#cluster.util.reply(message, new FormattableMessageContent({
                    content: templates.commands.$errors.blacklisted({ reason: result.detail.reason })
                }));
                return true;
            case 'MISSING_ROLE':
                await this.#cluster.util.reply(message, new FormattableMessageContent({
                    content: templates.commands.$errors.roleMissing({ roleIds: result.detail.reason })
                }));
                return true;
            case 'MISSING_PERMISSIONS': {
                const permissions = humanize.permissions(result.detail.reason, true);
                await this.#cluster.util.reply(message, new FormattableMessageContent({
                    content: templates.commands.$errors.permMissing({ permissions })
                }));
                return true;
            }
        }
    }
}
