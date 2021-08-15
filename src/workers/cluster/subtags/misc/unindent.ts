import { BaseSubtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class UnindentSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'unindent',
            category: SubtagType.COMPLEX,
            aliases: ['ui'],
            definition: [
                {
                    parameters: ['text', 'level?'],
                    description: 'Unindents text (or code!). If no level is provided, attempts to guess the indentation level past the first line.',
                    exampleCode: '```\n{unindent;\n  hello\n  world\n}\n```',
                    exampleOut: '```\nhello\nworld\n```',
                    execute: (_, [{value: text}, {value: levelStr}]) => {
                        let level: number | undefined = parse.int(levelStr);
                        if (isNaN(level)) {
                            level = undefined;
                            const lines = text.split('\n').slice(1);
                            for (const line of lines) {
                                let l = 0;
                                for (const letter of line) {
                                    if (letter === ' ') l++;
                                    else break;
                                }
                                if (level === undefined || l < level)
                                    level = l;
                            }
                        }
                        if (level !== undefined && level > 0) {
                            const regexp = new RegExp(`^ {1,${level}}`, 'gm');
                            const unindented = text.replace(regexp, '');
                            return unindented;
                        }
                        return text;
                    }
                }
            ]
        });
    }
}
