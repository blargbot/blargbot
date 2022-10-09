import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.logLevel;

export class LoglevelCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `loglevel`,
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: `{loglevel}`,
                    description: cmd.default.description,
                    execute: (ctx, [logLevel]) => this.setLogLevel(ctx, logLevel.asString)
                }
            ]
        });
    }

    public setLogLevel(context: CommandContext, logLevel: string): CommandResult {
        context.logger.setLevel(logLevel);
        return `✅ Log level set to \`${logLevel}\``;
    }
}
