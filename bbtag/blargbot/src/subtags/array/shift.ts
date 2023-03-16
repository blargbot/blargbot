import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.shift;

@Subtag.id('shift')
@Subtag.ctorArgs('arrayTools')
export class ShiftSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
        super({
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json|nothing',
                    execute: (context, [array]) => this.shift(context, array.value)
                }
            ]
        });

        this.#arrayTools = arrayTools;
    }

    public async shift(context: BBTagScript, arrayStr: string): Promise<JToken | undefined> {
        const { n: varName, v: array } = await this.#arrayTools.deserializeOrGetArray(context.runtime, arrayStr) ?? {};
        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        if (array.length === 0)
            return '';

        const result = array.shift();
        if (varName !== undefined)
            await context.runtime.variables.set(varName, array);

        return result;
    }
}
