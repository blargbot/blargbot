import type { CommandContext } from '@blargbot/cluster';
import { GlobalCommand } from '@blargbot/cluster';
import { CommandType } from '@blargbot/cluster';

import { templates } from '../../text.js';
import type { CommandResult } from '../../types.js';

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
