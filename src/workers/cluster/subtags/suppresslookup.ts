import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
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
                    execute: (ctx, args, subtag) => this.suppress(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public suppress(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): string | void {
        let suppress: boolean | undefined = true;
        if (args.length === 1) {
            suppress = parse.boolean(args[0]);
            if (typeof suppress !== 'boolean')
                return this.notABoolean(context, subtag);
        }

        context.scope.suppressLookup = suppress;
    }
}
