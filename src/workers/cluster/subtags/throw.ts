import { BaseSubtag, SubtagType } from '@cluster/core';

export class ThrowSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'throw',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['error?:A custom error occurred'],
                    description: 'Throws `error`.',
                    exampleCode: '{throw;Custom Error}',
                    exampleOut: '\u200B`Custom Error`\u200B',
                    execute: (ctx, [error], subtag) => this.customError(error.value, ctx, subtag)
                }
            ]
        });
    }
}
