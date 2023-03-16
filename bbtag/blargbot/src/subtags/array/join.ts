import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.join;

@Subtag.id('join')
@Subtag.ctorArgs('arrayTools')
export class JoinSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
        super({
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (context, [array, join]) => this.join(context, array.value, join.value)
                }
            ]
        });

        this.#arrayTools = arrayTools;
    }

    public async join(context: BBTagScript, arrayStr: string, separator: string): Promise<string> {
        const { v: array } = await this.#arrayTools.deserializeOrGetArray(context.runtime, arrayStr) ?? {};

        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        return array.join(separator);
    }
}
