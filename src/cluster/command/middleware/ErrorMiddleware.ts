import { CommandResult } from '@blargbot/cluster/types';
import { guard, snowflake } from '@blargbot/cluster/utils';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { ApiError, DiscordRESTError } from 'eris';

import templates from '../../text';
import { CommandContext } from '../CommandContext';

export class ErrorMiddleware<TContext extends CommandContext> implements IMiddleware<TContext, CommandResult> {
    public async execute(context: TContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        try {
            return await next();
        } catch (err: unknown) {
            const token = snowflake.create().toString();
            context.logger.error(`[Command error ${token}]`, context.command.name, err);

            if (err instanceof DiscordRESTError
                && err.code === ApiError.MISSING_ACCESS
                && await context.database.users.getSetting(context.author.id, 'dontdmerrors') !== true) {
                const message = !guard.isGuildCommandContext(context)
                    ? templates.commands.$errors.missingPermission.generic
                    : templates.commands.$errors.missingPermission.guild(context);
                await context.send(context.author, message);
            }

            return templates.commands.$errors.generic({ token });
        }
    }
}
