import { parse } from '@blargbot/core/utils';

import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.unindent;

export class UnindentSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'unindent',
            category: SubtagType.MISC,
            aliases: ['ui'],
            definition: [
                {
                    parameters: ['text', 'level?'],
                    description: 'Unindents text (or code!). If no level is provided, attempts to guess the indentation level past the first line.',
                    exampleCode: '```\n{unindent;\n  hello\n  world\n}\n```',
                    exampleOut: '```\nhello\nworld\n```',
                    returns: 'string',
                    execute: (_, [text, level]) => this.unindent(text.value, level.value)
                }
            ]
        });
    }

    public unindent(text: string, levelStr: string): string {
        let level = parse.int(levelStr);
        if (level === undefined) {
            const lines = text.split('\n').slice(1);
            level = lines.length === 0 ? 0 : Math.min(...lines.map(l => l.length - l.replace(/^ +/, '').length));
        }
        if (level === 0)
            return text;

        const regexp = new RegExp(`^ {1,${level}}`, 'gm');
        return text.replace(regexp, '');
    }
}
