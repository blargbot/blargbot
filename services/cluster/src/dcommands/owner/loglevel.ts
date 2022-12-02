import { CommandContext, GlobalCommand } from '../../command/index.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.logLevel;

export class LoglevelCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'loglevel',
            category: CommandType.OWNER,
            definitions: [
                {
                    parameters: '{loglevel}',
                    description: cmd.default.description,
                    execute: (ctx, [logLevel]) => this.setLogLevel(ctx, logLevel.asString)
                }
            ]
        });
    }

    public setLogLevel(context: CommandContext, logLevel: string): CommandResult {
        context.logger.setLevel(logLevel);
        return cmd.default.success({ logLevel });
    }
}
