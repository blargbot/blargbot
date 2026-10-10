import type { CommandContext } from '@blargbot/cluster';
import { CommandType, GlobalCommand } from '@blargbot/cluster';
import { Iterable, random } from '@blargbot/util';

import { templates } from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.syntax;

export class SyntaxCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'syntax',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{commandName+=}',
                    description: cmd.default.description,
                    execute: (ctx, [commandName]) => this.getSyntax(ctx, commandName.asString)
                }
            ]
        });
    }

    public getSyntax(context: CommandContext, commandName: string): CommandResult {
        return cmd.default.success({
            name: commandName.replace(/[\s\n]+/g, ' '),
            prefix: context.prefix,
            tokens: Iterable.range(random.int(1, 10)).map(i => getToken(i))
        });
    }
}

function getToken(index: number): string {
    index++;

    if (random.int(0, 7) !== 0 || index >= 4) {
        const bracket = random.pick(brackets);
        const token = bracket[0] === '' ? random.pick(keywords) : random.pick(tokens);
        return `${bracket[0]}${token}${bracket[1]}`;
    }

    const bracket = random.pick(brackets.filter(b => b[0] !== ''));
    const mTokens = Iterable.range(random.int(2, 4)).map(i => getToken(i)).toArray();
    return `${bracket[0]}${mTokens.join(random.pick(separators))}${bracket[1]}`;

}

const tokens = [
    'text', 'string', 'number', 'true/false', 'emote', 'fruit',
    'tag', 'name', 'duration', 'question', 'member', 'user', 'name',
    'command', 'integer', 'decimal', 'date', 'content', 'title', 'animal'
];
const keywords = ['edit', 'update', 'add', 'create', 'destroy', 'touch', 'fix', 'choose'];
const brackets = [
    ['<', '>'],
    ['[', ']'],
    ['', '']
];
const separators = [
    ' | ',
    ' '
];
