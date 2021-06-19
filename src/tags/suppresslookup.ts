import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType, parse } from '../utils';

export class SuppressLookupSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'suppresslookup',
            category: SubtagType.BOT,
            definition: [
                {
                    args: ['value?'],
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