import { parse } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class RollbackSubtag extends Subtag {
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
