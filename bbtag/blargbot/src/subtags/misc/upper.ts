import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class UpperSubtag extends Subtag {
    public constructor() {
        super({
            name: 'upper'
        });
    }

    @Subtag.signature(p.string('text')).returns('string')
    public uppercase(text: string): string {
        return text.toUpperCase();
    }
}
