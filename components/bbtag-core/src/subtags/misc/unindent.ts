import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class UnindentSubtag extends Subtag {
    public constructor() {
        super({
            name: 'unindent',
            aliases: ['ui']
        });
    }

    @Subtag.signature(p.string('text'), p.int('level').optional()).returns('string')
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
