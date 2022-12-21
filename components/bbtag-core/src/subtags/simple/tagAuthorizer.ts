import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import type { BBTagScript } from '../../runtime/BBTagScript.js';

export class TagAuthorizerSubtag extends Subtag {
    public constructor() {
        super({
            name: 'tagAuthorizer',
            aliases: ['customCommandAuthorizer', 'ccAuthorizer']
        });
    }

    @Subtag.signature(p.script).returns('string')
    public getAuthorizer(script: BBTagScript): string {
        return script.options.authorizer;
    }
}
