import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.throw;

export class ThrowSubtag extends CompiledSubtag {
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
