import { DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class ThrowSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'throw',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['error?:A custom error occurred'],
                    description: 'Throws `error`.',
                    exampleCode: '{throw;Custom Error}',
                    exampleOut: '\u200B`Custom Error`\u200B',
                    returns: 'error',
                    execute: (_, [error]) => this.throwError(error.value)
                }
            ]
        });
    }

    public throwError(message: string): never {
        throw new BBTagRuntimeError(message, 'A user defined error');
    }
}
