import { random } from '@blargbot/util';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.shuffle;

type Features = VariablesFeature;
export class ShuffleSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'shuffle',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: [],
                    description: tag.args.description,
                    exampleCode: tag.args.exampleCode,
                    exampleIn: tag.args.exampleIn,
                    exampleOut: tag.args.exampleOut,
                    returns: 'nothing',
                    execute: (ctx) => this.shuffleInput(ctx)
                },
                {
                    parameters: ['array'],
                    description: tag.array.description,
                    exampleCode: tag.array.exampleCode,
                    exampleOut: tag.array.exampleOut,
                    returns: 'json[]|nothing',
                    execute: (ctx, [array]) => this.shuffle(ctx, array.value)
                }
            ]
        });
        this.#features = features;
    }

    public shuffleInput(context: BBTagContext): void {
        const array = [...context.local.input.array];
        random.ishuffle(array);
        Object.assign(context.local.input, { array });
    }

    public async shuffle(context: BBTagContext, array: string): Promise<JArray | undefined> {
        const arr = bbtag.tagArray.deserialize(array);
        if (arr === undefined)
            throw new NotAnArrayError(array);

        random.ishuffle(arr.v);
        if (arr.n === undefined)
            return arr.v;

        await this.#features.variables.forContext(context).set(arr.n, arr.v);
        return undefined;
    }
}
