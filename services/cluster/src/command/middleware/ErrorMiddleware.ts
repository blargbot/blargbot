import { randomUUID } from 'node:crypto';

import type { CommandResult } from '@blargbot/cluster/types.js';
import { guard } from '@blargbot/cluster/utils/index.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import * as Eris from 'eris';

import templates from '../../text.js';
import type { CommandContext } from '../CommandContext.js';

export class ErrorMiddleware<TContext extends CommandContext> implements IMiddleware<TContext, CommandResult> {
    public async execute(context: TContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        try {
            return await next();
        } catch (err: unknown) {
            const token = randomUUID();
            context.logger.error(`[Command error ${token}]`, context.command.name, err);

            if (err instanceof Eris.DiscordRESTError
                && err.code === Eris.ApiError.MISSING_ACCESS
                && await context.database.users.getProp(context.author.id, 'dontdmerrors') !== true) {
                const message = !guard.isGuildCommandContext(context)
                    ? templates.commands.$errors.missingPermission.generic
                    : templates.commands.$errors.missingPermission.guild(context);
                await context.send(context.author, message);
            }

            return templates.commands.$errors.generic({ token });
        }
    }
}
