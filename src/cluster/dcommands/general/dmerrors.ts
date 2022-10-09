import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.dmErrors;

export class DMErrorsCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `dmerrors`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.default.description,
                    execute: ctx => this.toggleDMErrors(ctx)
                }
            ]
        });
    }

    public async toggleDMErrors(context: CommandContext): Promise<CommandResult> {
        const dmErrors = await context.database.users.getSetting(context.author.id, `dontdmerrors`);
        await context.database.users.setSetting(context.author.id, `dontdmerrors`, dmErrors !== true);

        if (dmErrors === true)
            return `✅ I will now DM you if I have an issue running a command.`;
        return `✅ I won't DM you if I have an issue running a command.`;
    }
}
