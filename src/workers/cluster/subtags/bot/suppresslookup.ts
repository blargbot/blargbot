import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { NotABooleanError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class SuppressLookupSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'suppresslookup',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['value?'],
                    description: 'Sets whether error messages in the lookup system (query canceled, nothing found) should be suppressed. `value` must be a boolean, and defaults to `true`.',
                    exampleCode: '{suppresslookup}',
                    exampleOut: '',
                    execute: (ctx, [value]) => this.suppress(ctx, value.value)
                }
            ]
        });
    }

    public suppress(
        context: BBTagContext,
        value: string
    ): string | void {
        let suppress: boolean | undefined = true;
        if (value !== '') {
            suppress = parse.boolean(value);
            if (suppress === undefined)
                throw new NotABooleanError(value);
        }

        context.scopes.local.noLookupErrors = suppress;
    }
}
