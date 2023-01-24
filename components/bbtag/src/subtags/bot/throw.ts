import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.throw;

@Subtag.id('throw')
@Subtag.factory()
export class ThrowSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
