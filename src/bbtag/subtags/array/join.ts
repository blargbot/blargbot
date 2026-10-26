import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.join;

type Features = VariablesFeature;
export class JoinSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'join',
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
        this.#features = features;
    }

    public async join(context: BBTagContext, arrayStr: string, separator: string): Promise<string> {
        const variables = this.#features.variables.forContext(context);
        const { v: array } = await bbtag.tagArray.deserializeOrGetArray(variables, arrayStr) ?? {};

        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return array.join(separator);
    }
}
