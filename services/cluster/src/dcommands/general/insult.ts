import { CommandType } from '@blargbot/cluster/utils/index.js';

import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.insult;

export class InsultCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'insult',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{name+}',
                    description: cmd.someone.description,
                    execute: (_, [name]) => this.insult(name.asString)
                },
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: () => this.insult('')
                }
            ]
        });
    }

    public insult(name: string): CommandResult {
        return name.length === 0
            ? cmd.default.success
            : cmd.someone.success({ name });
    }
}
