import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class UnindentSubtag extends Subtag {
    public constructor() {
        super({
            name: 'unindent',
            aliases: ['ui']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.string('text'))
        .parameter(p.int('level').optional())
    public unindent(text: string, level?: number): string {
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
