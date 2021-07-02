import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

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