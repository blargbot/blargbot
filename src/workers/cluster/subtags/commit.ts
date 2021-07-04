import { BaseSubtag, BBTagContext, bbtagUtil, SubtagType } from '../core';

export class CommitSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'commit',
            category: SubtagType.COMPLEX,
            desc:
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
                    execute: (ctx) => this.commit(ctx, [])
                },
                {
                    parameters: ['variables+'],
                    description: 'Commit provided `variables`',
                    exampleCode: '{set;var;Hello!}\n{commit;var}\n{set;var;GoodBye!}\n{rollback;var}\n{get;var}',
                    exampleOut: 'Hello!',
                    execute: async (ctx, args) => this.commit(ctx, args.map((arg) => arg.value))
                }
            ]
        });
    }

    public async commit(
        context: BBTagContext,
        args: string[]
    ): Promise<void> {
        const values = args.length === 0
            ? context.variables.list.map(entry => entry.key)
            : bbtagUtil.tagArray.flattenArray(args)
                .map(value => typeof value === 'object' ? JSON.stringify(value) : value?.toString() ?? '');
        await context.variables.persist(values);
    }
}
