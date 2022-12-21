import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import type { BBTagScript } from '../../runtime/BBTagScript.js';

export class TagAuthorSubtag extends Subtag {
    public constructor() {
        super({
            name: 'tagAuthor',
            aliases: ['customCommandAuthor', 'ccAuthor']
        });
    }

    @Subtag.signature(p.script).returns('string')
    public getAuthor(script: BBTagScript): string {
        return script.options.author;
    }
}
