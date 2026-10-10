import { CommandType, GlobalCommand  } from '@blargbot/cluster';
import { util } from '@blargbot/formatting';
import { random } from '@blargbot/util';

import { templates } from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.tokenify;

export class TokenifyCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'tokenify',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{input+}',
                    description: cmd.default.description,
                    execute: (_, [input]) => this.tokenify(input.asString)
                }
            ]
        });
    }

    public tokenify(input: string): CommandResult {
        const pasta = input.replace(/[^0-9a-z]/gi, '').toLowerCase();
        const newPasta = [];

        for (let i = 0; i < pasta.length; i++) {
            newPasta.push(random.int(1, 4) >= 3
                ? pasta[i].toUpperCase()
                : pasta[i].toLowerCase());

            if (i !== pasta.length - 1)
                continue;

            if (random.int(1, 20) === 1)
                newPasta.push('.');
            else if (random.int(1, 30) === 1)
                newPasta.push('-');
            else if (random.int(1, 30) === 30)
                newPasta.push('\\_');
        }

        return util.literal(newPasta.join(''));
    }
}
