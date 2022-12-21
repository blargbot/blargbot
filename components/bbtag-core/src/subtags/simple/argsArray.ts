import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import type { BBTagScript } from '../../runtime/BBTagScript.js';

export class ArgsArraySubtag extends Subtag {
    public constructor() {
        super({
            name: 'argsArray'
        });
    }

    @Subtag.signature(p.script).returns('string[]')
    public getInput(context: BBTagScript): string[] {
        return context.options.args;
    }
}
