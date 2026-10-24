import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.pop;

export class PopSubtag extends CompiledSubtag {
    readonly #variables: VariablesProvider;
    public constructor({ variables }: { variables: VariablesProvider; }) {
        super({
            name: 'pop',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json|nothing',
                    execute: (context, [array]) => this.pop(context, array.value)
                }
            ]
        });
        this.#variables = variables;
    }

    public async pop(context: BBTagContext, arrayStr: string): Promise<JToken | undefined> {
        const variables = this.#variables.forContext(context);
        const { n: varName, v: array } = await bbtag.tagArray.deserializeOrGetArray(variables, arrayStr) ?? {};
        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        if (array.length === 0)
            return '';

        const result = array.pop();
        if (varName !== undefined)
            await variables.set(varName, array);

        return result;
    }
}
