import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class RollbackSubtag extends BaseSubtag {
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
                    execute: (ctx) => this.rollback(ctx, [])
                },
                {
                    parameters: ['variables+'],
                    description: 'Rollback provided `variables`',
                    exampleCode: '{set;var;Hello!}\n{commit;varr}\n{set;var;GoodBye!}\n{rollback;var}\n{get;var}',
                    exampleOut: 'Hello!',
                    execute: async (ctx, args) => this.rollback(ctx, args.map((arg) => arg.value))
                }
            ]
        });
    }

    public async rollback(
        context: BBTagContext,
        args: string[]
    ): Promise<void> {
        const values = args.length === 0
            ? context.variables.list.map(entry => entry.key)
            : bbtagUtil.tagArray.flattenArray(args)
                .map((value) => typeof value === 'object' ? JSON.stringify(value) : value?.toString() ?? '');
        for (const variable of values)
            await context.variables.reset(variable);
    }
}
