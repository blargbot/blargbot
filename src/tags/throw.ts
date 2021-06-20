import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ThrowSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'throw',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['error?'],
                    description: 'Throws `error`.',
                    exampleCode: '{throw;Custom Error}',
                    exampleOut: '\u200B`Custom Error`\u200B',
                    execute: (ctx, args, subtag) => this.customError(args[0]?.value || 'A custom error occurred', ctx, subtag)
                }
            ]
        });
    }
}