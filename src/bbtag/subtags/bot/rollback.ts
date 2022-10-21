import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.rollback;

export class RollbackSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'rollback',
            category: SubtagType.BOT,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.all.description,
                    exampleCode: tag.all.exampleCode,
                    exampleOut: tag.all.exampleOut,
                    returns: 'nothing',
                    execute: (ctx) => this.rollback(ctx, [])
                },
                {
                    parameters: ['variables+'],
                    description: tag.variables.description,
                    exampleCode: tag.variables.exampleCode,
                    exampleOut: tag.variables.exampleOut,
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
