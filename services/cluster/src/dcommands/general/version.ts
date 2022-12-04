import { CommandType } from '@blargbot/cluster/utils/index.js';

import { CommandContext, GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.version;

export class VersionCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'version',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: (ctx) => this.getVersion(ctx)
                }
            ]
        });
    }

    public async getVersion(context: CommandContext): Promise<CommandResult> {
        const version = await context.cluster.version.getVersion();

        return cmd.default.success({ version });
    }
}
