import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { NotABooleanError } from '@blargbot/cluster/bbtag/errors';
import { parse, SubtagType } from '@blargbot/cluster/utils';

export class SuppressLookupSubtag extends DefinedSubtag {
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
