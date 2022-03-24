import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { bbtag, SubtagType } from '../../utils';

export class RollbackSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rollback',
            category: SubtagType.BOT,
            desc:
                'For optimization reasons, variables are not stored in the database immediately when you use `{set}`. ' +
                'Instead they are cached, and will be saved to the database when the tag finishes. If you have some `variables` ' +
                'that you dont want to be changed, you can use this to revert them back to their value at the start of the tag, or ' +
                'the most recent `{commit}`.\n`variables` defaults to all values accessed up to this point.\n' +
                '`{commit}` is the counterpart to this.',
            definition: [
                {
                    parameters: [],
                    description: 'Rollback all variables',
                    exampleCode: '{set;var;Hello!}\n{commit}\n{set;var;GoodBye!}\n{rollback}\n{get;var}',
                    exampleOut: 'Hello!',
                    returns: 'nothing',
                    execute: (ctx) => this.rollback(ctx, [])
                },
                {
                    parameters: ['variables+'],
                    description: 'Rollback provided `variables`',
                    exampleCode: '{set;var;Hello!}\n{commit;varr}\n{set;var;GoodBye!}\n{rollback;var}\n{get;var}',
                    exampleOut: 'Hello!',
                    returns: 'nothing',
                    execute: (ctx, variables) => this.rollback(ctx, variables.map((arg) => arg.value))
                }
            ]
        });
    }

    public rollback(context: BBTagContext, args: string[]): void {
        const keys = args.length === 0
            ? undefined
            : bbtag.tagArray.flattenArray(args).map(v => parse.string(v));
        context.variables.reset(keys);
    }
}
