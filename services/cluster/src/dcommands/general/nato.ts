import { GlobalCommand } from '../../command/index.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import { util } from '@blargbot/formatting';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.nato;

export class NatoCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'nato',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{text+}',
                    description: cmd.default.description,
                    execute: (_, [text]) => this.natoify(text.asString)
                }
            ]
        });
    }

    public natoify(text: string): CommandResult {
        const result = [];
        let other = '';
        for (const char of text) {
            const lower = char.toLowerCase();
            if (chars.includes<string>(lower)) {
                if (other !== '') {
                    result.push(other);
                    other = '';
                }
                result.push(natoMap[lower]);
            } else {
                other += char;
            }
        }
        if (other !== '')
            result.push(other);

        return util.literal(result.join(' '));
    }
}

const natoMap = {
    a: 'Alpha',
    b: 'Bravo',
    c: 'Charlie',
    d: 'Delta',
    e: 'Echo',
    f: 'Foxtrot',
    g: 'Golf',
    h: 'Hotel',
    i: 'India',
    j: 'Juliett',
    k: 'Kilo',
    l: 'Lima',
    m: 'Mike',
    n: 'November',
    o: 'Oscar',
    p: 'Papa',
    q: 'Quebec',
    r: 'Romeo',
    s: 'Sierra',
    t: 'Tango',
    u: 'Uniform',
    v: 'Victor',
    w: 'Whiskey',
    x: 'Xray',
    y: 'Yankee',
    z: 'Zulu'
} as const;
const chars = Object.keys(natoMap);
