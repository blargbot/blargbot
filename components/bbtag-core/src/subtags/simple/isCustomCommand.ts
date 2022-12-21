import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import type { BBTagScript } from '../../runtime/BBTagScript.js';

export class IsCustomCommandSubtag extends Subtag {
    public constructor() {
        super({
            name: 'isCustomCommand',
            aliases: ['isCC']
        });
    }

    @Subtag.signature(p.script).returns('boolean')
    public isCC(context: BBTagScript): boolean {
        return context.options.type === 'cc';
    }
}
