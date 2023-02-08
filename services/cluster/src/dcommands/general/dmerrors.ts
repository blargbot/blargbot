import { CommandType } from '@blargbot/cluster/utils/index.js';

import type { CommandContext} from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.dmErrors;

export class DMErrorsCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'dmerrors',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: ctx => this.toggleDMErrors(ctx)
                }
            ]
        });
    }

    public async toggleDMErrors(context: CommandContext): Promise<CommandResult> {
        const dmErrors = !(await context.database.users.getProp(context.author.id, 'dontdmerrors') ?? false);
        await context.database.users.setProp(context.author.id, 'dontdmerrors', dmErrors);

        return dmErrors
            ? cmd.default.enabled
            : cmd.default.disabled;
    }
}
