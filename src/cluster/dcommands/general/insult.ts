import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.insult;

export class InsultCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `insult`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{name+}`,
                    description: cmd.someone.description,
                    execute: (_, [name]) => this.insult(name.asString)
                },
                {
                    parameters: ``,
                    description: cmd.default.description,
                    execute: () => this.insult(``)
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
