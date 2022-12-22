import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';

export class ThrowSubtag extends Subtag {
    public constructor() {
        super({
            name: 'throw',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['error?:A custom error occurred'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
