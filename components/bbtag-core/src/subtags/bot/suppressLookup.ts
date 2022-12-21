import { parse } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { NotABooleanError } from '../../errors/index.js';

export class SuppressLookupSubtag extends Subtag {
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
