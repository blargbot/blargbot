import { parse } from '@blargbot/core/utils/index.js';

import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

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
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
