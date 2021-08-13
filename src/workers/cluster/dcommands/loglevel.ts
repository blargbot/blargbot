import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';

export class LoglevelCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'loglevel',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{loglevel}',
                    description: 'Sets the current log level',
                    execute: (ctx, [logLevel]) => this.setLogLevel(ctx, logLevel)
                }
            ]
        });
    }

    public setLogLevel(context: CommandContext, logLevel: string): string {
        context.logger.setLevel(logLevel);
        return this.success(`Log level set to \`${logLevel}\``);
    }
}
