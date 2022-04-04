import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { bbtag, SubtagType } from '../../utils';

export class CommitSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'commit',
            category: SubtagType.BOT,
            description:
                'For optimization reasons, variables are not stored in the database immediately when you use `{set}`. ' +
                'Instead they are cached, and will be saved to the database when the tag finishes. If you have some `variables` that ' +
                'you need to be saved to the database immediately, use this to force an update right now.\nThis comes at a slight ' +
                'performance cost, so use only when needed.\n`variables` defaults to all values accessed up to this point.\n' +
                '`{rollback}` is the counterpart to this.',
            definition: [
                {
                    parameters: [],
                    description: 'Commit all variables',
                    exampleCode: '{set;var;Hello!}\n{commit}\n{set;var;GoodBye!}\n{rollback}\n{get;var}',
                    exampleOut: 'Hello!',
                    returns: 'nothing',
                    execute: (ctx) => this.commit(ctx, [])
                },
                {
                    parameters: ['variables+'],
                    description: 'Commit provided `variables`',
                    exampleCode: '{set;var;Hello!}\n{commit;var}\n{set;var;GoodBye!}\n{rollback;var}\n{get;var}',
                    exampleOut: 'Hello!',
                    returns: 'nothing',
                    execute: (ctx, variables) => this.commit(ctx, variables.map((arg) => arg.value))
                }
            ]
        });
    }

    public async commit(
        context: BBTagContext,
        args: string[]
    ): Promise<void> {
        const values = args.length === 0
            ? undefined
            : bbtag.tagArray.flattenArray(args).map(value => parse.string(value));
        await context.variables.persist(values);
    }
}
