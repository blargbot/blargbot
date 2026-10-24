import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.push;

export class PushSubtag extends CompiledSubtag {
    readonly #variables: VariablesProvider;
    public constructor({ variables }: { variables: VariablesProvider; }) {
        super({
            name: 'push',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'values+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]|nothing',
                    execute: (context, [array, ...values]) => this.push(context, array.value, values.map(v => v.value))
                }
            ]
        });
        this.#variables = variables;
    }

    public async push(context: BBTagContext, arrayStr: string, values: string[]): Promise<JArray | undefined> {
        const variables = this.#variables.forContext(context);
        const { n: varName, v: array } = await bbtag.tagArray.deserializeOrGetArray(variables, arrayStr) ?? {};

        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        array.push(...values);
        if (varName === undefined)
            return array;

        await variables.set(varName, array);
        return undefined;
    }
}
