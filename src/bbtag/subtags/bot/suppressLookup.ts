import { parse } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError } from '../../errors/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.suppressLookup;

export class SuppressLookupSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'suppressLookup',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['value?:true'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [value]) => this.suppress(ctx, value.value)
                }
            ]
        });
    }

    public suppress(context: BBTagContext, value: string): void {
        let suppress: boolean | undefined = true;
        if (value !== '') {
            suppress = parse.boolean(value);
            if (suppress === undefined)
                throw new NotABooleanError(value);
        }

        context.scopes.local.noLookupErrors = suppress;
    }
}
