import type { BBTagScript } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { p } from '../p.js';

export class TagAuthorizerSubtag extends Subtag {
    public constructor() {
        super({
            name: 'tagAuthorizer',
            aliases: ['customCommandAuthorizer', 'ccAuthorizer']
        });
    }

    @Subtag.signature({ id: 'default' })
        .parameter(p.script)
    public getAuthorizer(script: BBTagScript): string {
        return script.options.authorizer;
    }
}
