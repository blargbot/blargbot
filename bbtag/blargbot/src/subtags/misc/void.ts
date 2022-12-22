import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class VoidSubtag extends Subtag {
    public constructor() {
        super({
            name: 'void',
            aliases: ['null']
        });
    }

    @Subtag.signature(p.string('code').repeat()).returns('void')
    public returnNothing(): void {
        /*NOOP*/
    }
}
