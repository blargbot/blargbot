import { shuffle } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { NotAnArrayError } from '../../errors/index.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class ShuffleSubtag extends Subtag {
    public constructor() {
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
    }

    public shuffleInput(context: BBTagContext): void {
        shuffle(context.input);
    }

    public async shuffle(context: BBTagContext, array: string): Promise<JArray | undefined> {
        const arr = bbtag.tagArray.deserialize(array);
        if (arr === undefined)
            throw new NotAnArrayError(array);

        shuffle(arr.v);
        if (arr.n === undefined)
            return arr.v;

        await context.variables.set(arr.n, arr.v);
        return undefined;
    }
}
