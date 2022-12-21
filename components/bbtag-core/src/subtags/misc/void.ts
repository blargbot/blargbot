import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

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
