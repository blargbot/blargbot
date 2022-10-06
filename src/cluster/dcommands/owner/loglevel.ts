import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

export class LoglevelCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `loglevel`,
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: `{loglevel}`,
                    description: `Sets the current log level`,
                    execute: (ctx, [logLevel]) => this.setLogLevel(ctx, logLevel.asString)
                }
            ]
        });
    }

    public setLogLevel(context: CommandContext, logLevel: string): string {
        context.logger.setLevel(logLevel);
        return this.success(`Log level set to \`${logLevel}\``);
    }
}
