import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import type { BBTagScript } from '../../runtime/BBTagScript.js';

export class ArgsLengthSubtag extends Subtag {
    public constructor() {
        super({
            name: 'argsLength'
        });
    }

    @Subtag.signature(p.script).returns('number')
    public getArgsLength(context: BBTagScript): number {
        return context.options.args.length;
    }
}
