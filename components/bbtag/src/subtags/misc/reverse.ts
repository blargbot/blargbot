import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.reverse;

@Subtag.names('reverse')
@Subtag.ctorArgs('arrayTools')
export class ReverseSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [text]) => this.reverse(ctx, text.value)
                }
            ]
        });

        this.#arrayTools = arrayTools;
    }

    public async reverse(context: BBTagContext, input: string): Promise<string> {
        const arr = this.#arrayTools.deserialize(input);
        if (arr === undefined)
            return input.split('').reverse().join('');

        arr.v = arr.v.reverse();
        if (arr.n === undefined)
            return this.#arrayTools.serialize(arr.v);

        await context.variables.set(arr.n, arr.v);
        return '';
    }
}
