import { CommandContext, GlobalCommand } from '../../command/index.js';
import { CommandType, randChoose, randInt, repeat } from '@blargbot/cluster/utils/index.js';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

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
            tokens: repeat(randInt(1, 10), i => getToken(i))
        });
    }
}

function getToken(index: number): string {
    index++;

    if (randInt(0, 7) !== 0 || index >= 4) {
        const bracket = randChoose(brackets);
        const token = bracket[0] === '' ? randChoose(keywords) : randChoose(tokens);
        return `${bracket[0]}${token}${bracket[1]}`;
    }

    const bracket = randChoose(brackets.filter(b => b[0] !== ''));
    const mTokens = repeat(randInt(2, 4), i => getToken(i));
    return `${bracket[0]}${mTokens.join(randChoose(separators))}${bracket[1]}`;

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
