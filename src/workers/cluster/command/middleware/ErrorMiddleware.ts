import { CommandResult } from '@cluster/types';
import { IMiddleware } from '@core/types';
import { snowflake } from '@core/utils';

import { CommandContext } from '../CommandContext';

export class ErrorMiddleware<TContext extends CommandContext> implements IMiddleware<TContext, CommandResult> {
    public async execute(context: TContext, next: () => Promise<CommandResult>): Promise<CommandResult> {
        try {
            return await next();
        } catch (err: unknown) {
            const token = snowflake.create().toString();
            context.logger.error(`[Command error ${token}]`, context.command.name, err);
            return `❌ Something went wrong while handling your command!\nError id: \`${token}\``;
        }
    }
}
