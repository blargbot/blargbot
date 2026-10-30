import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.reverse;

type Features = VariablesFeature;
export class ReverseSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'reverse',
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
        this.#features = features;
    }

    public async reverse(context: BBTagContext, input: string): Promise<string> {
        const arr = bbtag.tagArray.deserialize(input);
        if (arr === undefined)
            return input.split('').reverse().join('');

        arr.v = arr.v.reverse();
        if (arr.n === undefined)
            return bbtag.tagArray.serialize(arr.v);

        await this.#features.variables.forContext(context).set(arr.n, arr.v);
        return '';
    }
}
